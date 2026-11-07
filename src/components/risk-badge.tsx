import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/mock-data";

const RISK: Record<
  RiskLevel,
  { label: string; icon: LucideIcon; className: string }
> = {
  scam: {
    label: "Likely scam",
    icon: OctagonAlert,
    className: "bg-risk-scam-bg text-risk-scam border-risk-scam",
  },
  suspicious: {
    label: "Suspicious",
    icon: TriangleAlert,
    className:
      "bg-risk-suspicious-bg text-risk-suspicious border-risk-suspicious",
  },
  ok: {
    label: "Looks OK",
    icon: CircleCheck,
    className: "bg-risk-ok-bg text-risk-ok border-risk-ok",
  },
};

export function riskLabel(risk: RiskLevel): string {
  return RISK[risk].label;
}

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: "sm" | "lg";
  className?: string;
}

/** Risk level shown with text + icon + color (never color alone). */
export function RiskBadge({ risk, size = "sm", className }: RiskBadgeProps) {
  const { label, icon: Icon, className: tone } = RISK[risk];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border font-semibold",
        size === "lg" ? "px-4 py-2 text-xl" : "px-2.5 py-0.5 text-sm",
        tone,
        className,
      )}
    >
      <Icon aria-hidden className={size === "lg" ? "size-6" : "size-4"} />
      {label}
    </span>
  );
}
