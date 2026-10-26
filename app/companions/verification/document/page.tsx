import { redirect } from 'next/navigation';

/**
 * O vídeo e o documento passaram a ser enviados na mesma página (passo 4 do
 * registo). Este endereço fica para quem o tenha guardado.
 */
export default function DocumentVerificationPage() {
  redirect('/companions/verification');
}
