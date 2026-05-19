import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rupiah Tracker",
    short_name: "Rupiah",
    description: "USD/IDR tracker — update tiga kali sehari.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F2EDE3",
    theme_color: "#F2EDE3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
