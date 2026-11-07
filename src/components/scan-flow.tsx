"use client";

import {
  Camera,
  ClipboardPaste,
  ImageIcon,
  Info,
  Lightbulb,
  RotateCcw,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ReasonList } from "@/components/reason-list";
import { RiskBadge } from "@/components/risk-badge";
import { SafetyGuidance } from "@/components/safety-guidance";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { exampleMessages, mockCheck } from "@/lib/mock-data";
import type { CheckResult } from "@/lib/mock-data";

const MAX_CHARS = 1500;
const MOCK_DELAY_MS = 800;

type ViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; text: string; result: CheckResult };

const triggerClass =
  "min-h-11 flex-1 px-2 text-base whitespace-normal data-[state=active]:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary-foreground";

export function ScanFlow() {
  const [text, setText] = useState("");
  const [view, setView] = useState<ViewState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const resultRegion = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (view.status === "loading") {
      resultRegion.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (view.status === "result") {
      resultHeading.current?.focus({ preventScroll: true });
    }
  }, [view.status]);

  function runMockCheck(message: string, result: CheckResult) {
    if (timer.current) clearTimeout(timer.current);
    setView({ status: "loading" });
    timer.current = setTimeout(() => {
      setView({ status: "result", text: message, result });
    }, MOCK_DELAY_MS);
  }

  function photoNotReady() {
    toast("Photo scanning arrives in the next layer");
  }

  const trimmed = text.trim();

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="photo" className="gap-4">
        <TabsList className="w-full group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="photo" className={triggerClass}>
            Photo
          </TabsTrigger>
          <TabsTrigger value="paste" className={triggerClass}>
            Paste or type
          </TabsTrigger>
          <TabsTrigger value="example" className={triggerClass}>
            Try an example
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={photoNotReady}>
            <Camera aria-hidden />
            Take a photo
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={photoNotReady}
          >
            <ImageIcon aria-hidden />
            Choose from library
          </Button>
          <p className="flex items-start gap-2 text-muted-foreground">
            <Info aria-hidden className="mt-1 size-5 shrink-0" />
            Your photo stays on your phone.
          </p>
        </TabsContent>

        <TabsContent value="paste">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (trimmed) runMockCheck(trimmed, mockCheck(trimmed));
            }}
          >
            <label htmlFor="message-text" className="font-semibold">
              Paste or type the message
            </label>
            <Textarea
              id="message-text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              maxLength={MAX_CHARS}
              rows={6}
              placeholder="Paste the text message here"
              aria-describedby="char-count"
              className="min-h-36 bg-card text-base"
            />
            <p
              id="char-count"
              className="text-right text-sm text-muted-foreground"
              aria-live="polite"
            >
              {text.length} / {MAX_CHARS} characters
            </p>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!trimmed || view.status === "loading"}
            >
              <ClipboardPaste aria-hidden />
              Check this message
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="example" className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            These are made-up messages so you can see how a check works.
          </p>
          <ul className="flex flex-col gap-3">
            {exampleMessages.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => runMockCheck(ex.text, ex.result)}
                  className="flex w-full flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-secondary"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Lightbulb aria-hidden className="size-5 text-primary" />
                    {ex.title}
                  </span>
                  <span className="text-muted-foreground">{ex.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <div
        ref={resultRegion}
        aria-live="polite"
        aria-busy={view.status === "loading"}
        className="scroll-mt-4"
      >
        {view.status === "loading" ? <ResultSkeleton /> : null}
        {view.status === "result" ? (
          <section
            aria-labelledby="result-heading"
            className="flex flex-col gap-5 rounded-2xl border-2 bg-card p-4"
          >
            <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
              <Info aria-hidden className="size-4 shrink-0" />
              Demo result - no real check was run.
            </p>
            <div className="flex flex-col gap-2">
              <h2
                id="result-heading"
                ref={resultHeading}
                tabIndex={-1}
                className="text-xl font-bold"
              >
                Our assessment
              </h2>
              <RiskBadge risk={view.result.risk} size="lg" />
            </div>
            <blockquote className="rounded-lg border-l-4 border-primary bg-muted px-3 py-2 text-muted-foreground">
              {view.text}
            </blockquote>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold">Why</h3>
              <ReasonList reasons={view.result.reasons} />
            </div>
            <SafetyGuidance dont={view.result.dont} do={view.result.do} />
            <Button
              size="lg"
              className="w-full"
              onClick={() => toast("Coming in a later layer")}
            >
              <Users aria-hidden />
              Ask my circle
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setView({ status: "idle" })}
            >
              <RotateCcw aria-hidden />
              Check another message
            </Button>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <span className="sr-only">Checking the message…</span>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-10 w-40 rounded-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
