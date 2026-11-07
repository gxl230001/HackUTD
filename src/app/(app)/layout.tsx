import { BottomNav } from "@/components/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { unreadCount } from "@/lib/mock-data";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pt-safe mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <OfflineBanner />
      <main className="flex flex-1 flex-col gap-6 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
}
