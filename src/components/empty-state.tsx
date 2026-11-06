import Link from "next/link";

export function EmptyState({
  title,
  children,
  href,
  action,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-symbol" aria-hidden="true">
        ✧
      </span>
      <h2>{title}</h2>
      <div className="empty-description">{children}</div>
      {href && action ? (
        <Link className="text-link" href={href}>
          {action} <span aria-hidden="true">↗</span>
        </Link>
      ) : null}
    </div>
  );
}
