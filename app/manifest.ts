import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kai Health 健康管理",
    short_name: "Kai Health",
    description: "体重・睡眠・食事・筋トレを 1 画面で管理する個人用ツール",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8ff",
    theme_color: "#ffffff",
    lang: "ja",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
