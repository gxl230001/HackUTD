import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CloseGuard",
    short_name: "CloseGuard",
    description:
      "Check a suspicious text message and ask your trusted circle for help.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9fa",
    theme_color: "#c20081",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
