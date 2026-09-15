/** Pit-board card surface: carbon weave, hairline border, cut top-right corner. */
export function Panel({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={`pit-board carbon-weave border border-line ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Section heading in headline caps, with an optional kerb stripe and trailing action. */
export function SectionHeader({
  title,
  kerb = false,
  action,
  id,
}: {
  title: string;
  kerb?: boolean;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="headline text-xl">
          {title}
        </h2>
        {kerb && <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />}
      </div>
      {action}
    </div>
  );
}
