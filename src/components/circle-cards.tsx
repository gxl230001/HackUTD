"use client";

import { Copy, LogIn } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function InviteCodeCard({ code }: { code: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast(`Couldn't copy automatically. Your code is ${code}`);
    }
  }

  return (
    <Card className="border-2 border-primary ring-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold">Invite someone</h2>
        </CardTitle>
        <CardDescription>
          Share this code with someone you trust so they can join your circle.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p
          className="rounded-xl bg-secondary py-4 text-center font-mono text-3xl font-bold tracking-widest text-secondary-foreground"
          aria-label={`Invite code: ${code.split("").join(" ")}`}
        >
          {code}
        </p>
        <Button size="lg" className="w-full" onClick={copy}>
          <Copy aria-hidden />
          Copy code
        </Button>
      </CardContent>
    </Card>
  );
}

export function JoinCircleCard() {
  const id = useId();
  const [code, setCode] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold">Join a circle</h2>
        </CardTitle>
        <CardDescription>
          Got a code from someone? Type it here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            toast("Joining a circle is coming in a later layer");
          }}
        >
          <label htmlFor={id} className="font-semibold">
            Invite code
          </label>
          <Input
            id={id}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="For example: ABC-123"
            className="bg-card text-lg"
          />
          <Button type="submit" variant="outline" className="w-full" disabled={!code.trim()}>
            <LogIn aria-hidden />
            Join
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface PreferenceRowProps {
  label: string;
  helper: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function PreferenceRow({ label, helper, checked, onChange }: PreferenceRowProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <p id={`${id}-help`} className="text-muted-foreground">
          {helper}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={`${id}-help`}
        className="mt-1"
      />
    </div>
  );
}

export function SharingPreferencesCard() {
  const [shareText, setShareText] = useState(false);
  const [shareFindings, setShareFindings] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl font-bold">What you share</h2>
        </CardTitle>
        <CardDescription>
          Choose what your circle can see when you ask for help.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PreferenceRow
          label="Allow sharing message text"
          helper="Your circle can read the actual words of the message you got."
          checked={shareText}
          onChange={setShareText}
        />
        <Separator />
        <PreferenceRow
          label="Allow sharing findings"
          helper="Your circle sees only what we found, like “asks for money” or “has a strange link”, not the message itself."
          checked={shareFindings}
          onChange={setShareFindings}
        />
      </CardContent>
    </Card>
  );
}
