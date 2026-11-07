import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ScanFlow } from "@/components/scan-flow";

export const metadata: Metadata = { title: "Scan" };

export default function ScanPage() {
  return (
    <>
      <PageHeader
        title="Check a message"
        description="Take a photo of the text, paste it, or try an example."
      />
      <ScanFlow />
    </>
  );
}
