import { Check, X } from "lucide-react";

interface SafetyGuidanceProps {
  dont: string[];
  do: string[];
}

export function SafetyGuidance({ dont, do: doList }: SafetyGuidanceProps) {
  return (
    <div className="grid gap-4">
      <section aria-labelledby="dont-heading" className="rounded-xl border border-risk-scam/40 bg-risk-scam-bg p-4">
        <h3 id="dont-heading" className="mb-2 text-lg font-bold text-risk-scam">
          Don&apos;t
        </h3>
        <ul className="flex flex-col gap-2">
          {dont.map((item) => (
            <li key={item} className="flex gap-2">
              <X aria-hidden className="mt-1 size-5 shrink-0 text-risk-scam" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="do-heading" className="rounded-xl border border-risk-ok/40 bg-risk-ok-bg p-4">
        <h3 id="do-heading" className="mb-2 text-lg font-bold text-risk-ok">
          Do
        </h3>
        <ul className="flex flex-col gap-2">
          {doList.map((item) => (
            <li key={item} className="flex gap-2">
              <Check aria-hidden className="mt-1 size-5 shrink-0 text-risk-ok" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
