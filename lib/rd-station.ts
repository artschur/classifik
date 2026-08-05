const RD_TOKEN_URL = 'https://api.rd.services/auth/token';
const RD_CONTACTS_URL = 'https://api.rd.services/platform/contacts';

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
  if (!process.env.RD_STATION_CLIENT_ID) return;

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
    }
  } catch (error) {
    console.error('RD Station: erro ao sincronizar lead', error);
  }
}

/**
 * Marca um contacto no RD Station com a tag "aprovado" ou "recusado".
 * As tags são cumulativas na API do RD Station (não substituem as
 * existentes), e as automações de e-mail (boas-vindas / perfil recusado)
 * já estão configuradas para disparar quando a tag é adicionada.
 */
export async function tagCompanionInRD(
  email: string,
  tag: 'aprovado' | 'recusado',
): Promise<void> {
  if (!process.env.RD_STATION_CLIENT_ID) return;

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

    if (!response.ok) {
      console.error(
        `RD Station: falha ao marcar tag "${tag}" para ${email} (${response.status})`,
      );
    }
  } catch (error) {
    console.error('RD Station: erro ao sincronizar tag', error);
  }
}
