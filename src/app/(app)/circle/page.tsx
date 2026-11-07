import type { Metadata } from "next";

import {
  InviteCodeCard,
  JoinCircleCard,
  SharingPreferencesCard,
} from "@/components/circle-cards";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { circle } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Circle" };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CirclePage() {
  return (
    <>
      <PageHeader
        title={circle.name}
        description="People you trust to help you check messages."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-xl font-bold">
              Members ({circle.members.length})
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {circle.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-11 items-center justify-center rounded-full bg-secondary font-bold text-secondary-foreground"
                >
                  {initials(m.displayName)}
                </span>
                <span className="text-lg">
                  {m.displayName}
                  {m.isYou ? (
                    <span className="text-muted-foreground"> (you)</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <InviteCodeCard code={circle.inviteCode} />
      <JoinCircleCard />
      <SharingPreferencesCard />
    </>
  );
}
