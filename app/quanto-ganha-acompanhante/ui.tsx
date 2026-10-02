/** Título de secção da página da calculadora, partilhado pelas versões PT e EN. */
export function SectionTitle({
  id,
  title,
  icon,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-rose-500">{icon}</span>
        </div>
      )}
      <h2 id={id} className="text-2xl font-bold text-foreground scroll-mt-24 pt-1">
        {title}
      </h2>
    </div>
  );
}
