import type { Reason } from "@/lib/mock-data";

interface ReasonListProps {
  reasons: Reason[];
}

const SOURCE_LABEL: Record<Reason["source"], string> = {
  rule: "from rule",
  model: "from model",
};

export function ReasonList({ reasons }: ReasonListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {reasons.map((reason) => (
        <li
          key={reason.id}
          className="flex flex-col gap-1 rounded-xl border bg-card p-3"
        >
          <span>{reason.text}</span>
          <span className="w-fit rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {SOURCE_LABEL[reason.source]}
          </span>
        </li>
      ))}
    </ul>
  );
}
