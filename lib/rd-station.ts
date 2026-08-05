const RD_TOKEN_URL = 'https://api.rd.services/auth/token';
const RD_CONTACTS_URL = 'https://api.rd.services/platform/contacts';
const RD_EVENTS_URL = 'https://api.rd.services/platform/events?event_type=conversion';

/**
 * Identificadores de conversão usados como gatilho dos fluxos de automação
 * no RD Station. O gatilho por tag ("Campo do Lead") exige plano PRO, por
 * isso as automações são disparadas por evento de conversão, que está
 * disponível em todos os planos.
 */
export const RD_CONVERSION_APROVADA = 'sugar-aprovada';
export const RD_CONVERSION_RECUSADA = 'sugar-recusada';

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  const response = await fetch(RD_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.RD_STATION_CLIENT_ID,
      client_secret: process.env.RD_STATION_CLIENT_SECRET,
      refresh_token: process.env.RD_STATION_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error(`RD Station: falha ao renovar access token (${response.status})`);
  }

  const data = await response.json();
  cachedAccessToken = {
    token: data.access_token,
    // renova 60s antes de expirar, por segurança
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedAccessToken.token;
}

/**
 * Cria (se ainda não existir) ou atualiza o lead no RD Station, identificado
 * pelo e-mail. Usado tanto no cadastro quanto em qualquer edição de perfil,
 * para manter nome/telefone sincronizados. Não usa POST /platform/contacts
 * (esse endpoint só cria — falha com EMAIL_ALREADY_IN_USE se o lead já existir).
 */
export async function upsertContactInRD(contact: {
  email: string;
  name?: string;
  phone?: string;
}): Promise<void> {
  if (!process.env.RD_STATION_CLIENT_ID) {
    console.log('RD Station: RD_STATION_CLIENT_ID ausente, integração desativada');
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const contactUrl = `${RD_CONTACTS_URL}/email:${encodeURIComponent(contact.email)}`;

    // Ao atualizar por e-mail, o campo "email" não deve ir no corpo.
    const body: Record<string, string> = {};
    if (contact.name) body.name = contact.name;
    if (contact.phone) body.mobile_phone = contact.phone;

    const response = await fetch(contactUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        `RD Station: falha ao sincronizar lead ${contact.email} (${response.status})`,
      );
    } else {
      console.log(`RD Station: lead sincronizado com sucesso (${contact.email})`);
    }
  } catch (error) {
    console.error('RD Station: erro ao sincronizar lead', error);
  }
}

/**
 * Marca um contacto no RD Station com a tag "aprovado" ou "recusado".
 * As tags são cumulativas na API do RD Station (não substituem as
 * existentes) e servem para segmentação e leitura rápida do estado do
 * perfil na base. O disparo das automações de e-mail não depende delas —
 * é feito pelo evento de conversão (ver sendConversionEventToRD).
 *
 * O endpoint de tag só aceita contactos já existentes na Base de Leads
 * (erro RESOURCE_NOT_FOUND / 404 caso contrário) — companions cadastradas
 * antes desta integração entrar no ar nunca viraram lead no RD Station.
 * Se a tag falhar por esse motivo, cria o lead com a tag incluída.
 */
export async function tagCompanionInRD(
  email: string,
  tag: 'aprovado' | 'recusado',
  name?: string,
): Promise<void> {
  if (!process.env.RD_STATION_CLIENT_ID) {
    console.log('RD Station: RD_STATION_CLIENT_ID ausente, integração desativada');
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const tagUrl = `${RD_CONTACTS_URL}/email:${encodeURIComponent(email)}/tag`;

    const response = await fetch(tagUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags: [tag] }),
    });

    if (response.status === 404) {
      // Lead ainda não existe no RD Station — cria já com a tag.
      const contactUrl = `${RD_CONTACTS_URL}/email:${encodeURIComponent(email)}`;
      const createResponse = await fetch(contactUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...(name ? { name } : {}), tags: [tag] }),
      });

      if (!createResponse.ok) {
        console.error(
          `RD Station: falha ao criar lead com tag "${tag}" para ${email} (${createResponse.status})`,
        );
      } else {
        console.log(`RD Station: lead criado com tag "${tag}" (${email})`);
      }
      return;
    }

    if (!response.ok) {
      console.error(
        `RD Station: falha ao marcar tag "${tag}" para ${email} (${response.status})`,
      );
    } else {
      console.log(`RD Station: tag "${tag}" marcada com sucesso (${email})`);
    }
  } catch (error) {
    console.error('RD Station: erro ao sincronizar tag', error);
  }
}

/**
 * Regista um evento de conversão no RD Station. É este evento — e não a
 * tag — que dispara os fluxos de automação de e-mail, porque o gatilho
 * "Converteram no evento" está disponível em todos os planos, enquanto o
 * gatilho por tag ("Campo do Lead") exige plano PRO.
 *
 * O evento também cria ou actualiza o contacto na Base de Leads, portanto
 * funciona mesmo para companions que ainda não existiam no RD Station.
 */
export async function sendConversionEventToRD(
  email: string,
  conversionIdentifier: string,
  name?: string,
): Promise<void> {
  if (!process.env.RD_STATION_CLIENT_ID) {
    console.log('RD Station: RD_STATION_CLIENT_ID ausente, integração desativada');
    return;
  }

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(RD_EVENTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'CONVERSION',
        event_family: 'CDP',
        payload: {
          conversion_identifier: conversionIdentifier,
          email,
          ...(name ? { name } : {}),
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `RD Station: falha no evento "${conversionIdentifier}" para ${email} (${response.status})`,
      );
    } else {
      console.log(
        `RD Station: evento "${conversionIdentifier}" registado com sucesso (${email})`,
      );
    }
  } catch (error) {
    console.error('RD Station: erro ao registar evento de conversão', error);
  }
}
