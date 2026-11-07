"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // assume online during server render
  );

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2 bg-foreground px-4 py-3 text-background"
    >
      <WifiOff aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p>
        You&apos;re offline. Scanning still works, but checking a message needs a
        connection.
      </p>
    </div>
  );
}
