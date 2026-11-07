"use client";

import {
  BellOff,
  CheckCheck,
  CircleCheck,
  EyeOff,
  HandHelping,
  MessageCircleReply,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReasonList } from "@/components/reason-list";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/mock-data";

const TYPE_META: Record<NotificationType, { icon: LucideIcon; label: string }> = {
  help_request: { icon: HandHelping, label: "Help request" },
  response: { icon: MessageCircleReply, label: "Response" },
  resolved: { icon: CircleCheck, label: "Resolved" },
  sharing_withdrawn: { icon: EyeOff, label: "Sharing stopped" },
};

interface NotificationListProps {
  initial: AppNotification[];
}

export function NotificationList({ initial }: NotificationListProps) {
  const [items, setItems] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const unread = items.filter((n) => !n.read).length;
  const open = items.find((n) => n.id === openId) ?? null;

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <>
      <PageHeader
        title="Alerts"
        description={
          unread > 0 ? `You have ${unread} unread.` : "You're all caught up."
        }
        action={
          items.length > 0 ? (
            <Button
              variant="outline"
              disabled={unread === 0}
              onClick={() =>
                setItems((prev) => prev.map((n) => ({ ...n, read: true })))
              }
            >
              <CheckCheck aria-hidden />
              Mark all read
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No alerts yet"
          description="When someone in your circle asks for help or answers you, it will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => {
            const { icon: Icon, label } = TYPE_META[n.type];
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full",
                    n.read
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    {!n.read ? (
                      <span className="rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                        New
                      </span>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {label} · {n.time}
                    </span>
                  </span>
                  <span className={cn(n.read ? "font-medium" : "font-bold")}>
                    {n.title}
                  </span>
                  <span className="text-muted-foreground">{n.body}</span>
                </span>
              </>
            );
            const boxClass = cn(
              "flex w-full items-start gap-3 rounded-xl border p-4 text-left",
              n.read ? "bg-card" : "border-primary/50 bg-secondary",
            );
            return (
              <li key={n.id}>
                {n.type === "help_request" ? (
                  <button
                    type="button"
                    className={cn(boxClass, "transition-colors hover:border-primary")}
                    onClick={() => {
                      markRead(n.id);
                      setOpenId(n.id);
                    }}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={boxClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[90dvh] max-w-[480px] overflow-y-auto rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          {open ? <HelpRequestView key={open.id} notification={open} /> : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

type Answer = "scam" | "ok" | "unsure";

const ANSWERS: { value: Answer; label: string }[] = [
  { value: "scam", label: "Looks like a scam" },
  { value: "ok", label: "Looks OK" },
  { value: "unsure", label: "Not sure" },
];

function SharedTag({ shared }: { shared: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-sm font-medium",
        shared ? "bg-risk-ok-bg text-risk-ok" : "bg-muted text-muted-foreground",
      )}
    >
      {shared ? "Shared" : "Not shared"}
    </span>
  );
}

function HelpRequestView({ notification }: { notification: AppNotification }) {
  const guidanceId = useId();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [guidance, setGuidance] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const request = notification.request;

  return (
    <>
      <SheetHeader className="pr-14">
        <SheetTitle className="text-xl font-bold">
          {notification.from} needs your help
        </SheetTitle>
        <SheetDescription>
          Look at what {notification.from} shared and tell them what you think.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-4">
        <p className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
          Demo request - this is sample data.
        </p>

        {request ? (
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Our assessment</span>
            <RiskBadge risk={request.risk} />
          </div>
        ) : null}

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Message text</h3>
            <SharedTag shared={Boolean(request?.messageText)} />
          </div>
          {request?.messageText ? (
            <blockquote className="rounded-lg border-l-4 border-primary bg-muted px-3 py-2">
              {request.messageText}
            </blockquote>
          ) : (
            <p className="text-muted-foreground">
              {notification.from} chose not to share the message text.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">What we found</h3>
            <SharedTag shared={Boolean(request?.findings)} />
          </div>
          {request?.findings ? (
            <ReasonList reasons={request.findings} />
          ) : (
            <p className="text-muted-foreground">
              {notification.from} chose not to share findings.
            </p>
          )}
        </section>

        {submitted ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-risk-ok bg-risk-ok-bg p-4 font-semibold text-risk-ok"
          >
            <CircleCheck aria-hidden className="size-6" />
            Thanks, you responded.
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!answer) return;
              setSubmitted(true);
              toast.success(`Response sent to ${notification.from} (demo)`);
            }}
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-lg font-bold">What do you think?</legend>
              {ANSWERS.map((a) => (
                <Button
                  key={a.value}
                  type="button"
                  variant={answer === a.value ? "default" : "outline"}
                  aria-pressed={answer === a.value}
                  className="w-full"
                  onClick={() => setAnswer(a.value)}
                >
                  {a.label}
                </Button>
              ))}
            </fieldset>
            <label htmlFor={guidanceId} className="font-semibold">
              Add a note (optional)
            </label>
            <Textarea
              id={guidanceId}
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              rows={3}
              placeholder="For example: Don't tap the link. Call the bank instead."
              className="bg-card"
            />
            <Button type="submit" size="lg" className="w-full" disabled={!answer}>
              Send my answer
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
