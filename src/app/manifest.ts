import type { MetadataRoute } from "next";
import { siteName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description:
      "給自由接案者跟小型工作室的輕量記帳與報價工具：開報價單、線上簽署、追蹤待收款、記錄收支。",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#181715",
    theme_color: "#181715",
    lang: "zh-Hant",
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "儀表板總覽",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "390x844",
        type: "image/png",
        label: "手機版儀表板",
      },
    ],
  };
}
