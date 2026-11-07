import type { Metadata } from "next";

import { NotificationList } from "@/components/notification-list";
import { notifications } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Alerts" };

// Flip to true to preview the empty state.
const SHOW_EMPTY = false;

export default function NotificationsPage() {
  return <NotificationList initial={SHOW_EMPTY ? [] : notifications} />;
}
