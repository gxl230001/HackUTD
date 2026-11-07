import { Camera, ChevronRight, Inbox, ScanLine, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RiskBadge, riskLabel } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { circle, currentUser, recentChecks } from "@/lib/mock-data";

// Flip to true to preview the empty state for recent checks.
const SHOW_EMPTY_RECENT = false;

const STEPS = [
  { title: "Take a photo", text: "Snap or paste the text message you got." },
  { title: "See the risk", text: "We explain in plain words what looks wrong." },
  { title: "Ask your circle", text: "Get a second opinion from people you trust." },
];

export default function HomePage() {
  const checks = SHOW_EMPTY_RECENT ? [] : recentChecks;

  return (
    <>
      <PageHeader
        title={`Hi, ${currentUser.firstName}`}
        description="Got a text that feels off? Check it before you act."
      />

      <Button asChild size="lg" className="w-full">
        <Link href="/scan">
          <ScanLine aria-hidden />
          Scan a message
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-xl font-bold">How it works</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </p>
                  <p className="text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <h2 id="recent-heading" className="text-xl font-bold">
          Recent checks
        </h2>
        {checks.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No checks yet"
            description="When you check a message, it will show up here."
            action={
              <Button asChild>
                <Link href="/scan">
                  <Camera aria-hidden />
                  Check a message
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {checks.map((check) => (
              <li
                key={check.id}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4"
                aria-label={`${riskLabel(check.risk)}, ${check.checkedAt}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <RiskBadge risk={check.risk} />
                  <span className="text-sm text-muted-foreground">
                    {check.checkedAt}
                  </span>
                </div>
                <p className="line-clamp-2">{check.preview}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Users aria-hidden className="size-5 text-primary" />
              {circle.name}
            </h2>
          </CardTitle>
          <CardDescription>
            {circle.members.length} people can help you check messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/circle">
              See my circle
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
