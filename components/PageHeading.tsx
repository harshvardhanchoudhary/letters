export function PageHeading({
  number,
  title,
  description,
  action,
}: {
  number: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">THE JOURNAL / {number}</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      {action}
    </header>
  );
}
