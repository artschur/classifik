import type React from 'react';

/**
 * Moldura das páginas /companions. Já não desenha caminho nenhum: o caminho
 * genérico que estava aqui ("Início › Localização › Sugars") aparecia em todas
 * as páginas, incluindo os perfis, que têm o seu próprio, e o registo e a
 * verificação. Cada página que precisa de caminho desenha o seu.
 */
export default function CompanionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
