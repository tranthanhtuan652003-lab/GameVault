import { cn } from "@/lib/cn";

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <span className="mb-3 block h-1 w-10 rounded-full bg-accent" />
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
