import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getGuide } from "@/lib/guides";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);

  const fontData = await readFile(
    join(process.cwd(), "src/fonts/NotoSansTC-Regular.otf")
  );
  const fontBoldData = await readFile(
    join(process.cwd(), "src/fonts/NotoSansTC-Bold.otf")
  );

  const title = guide?.title ?? "接案帳本 知識庫";
  const description = guide?.description ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#181715",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "NotoSansTC",
        }}
      >
        {/* 頂部品牌 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#c2410c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", color: "#fff", fontSize: "18px", fontWeight: 700 }}>帳</div>
          </div>
          <span style={{ color: "#fdfcfa", fontSize: "20px", fontWeight: 400 }}>
            接案帳本
          </span>
        </div>

        {/* 主要內容 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#fdfcfa",
              fontSize: title.length > 20 ? "44px" : "52px",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.5px",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                color: "#9c9589",
                fontSize: "22px",
                lineHeight: 1.5,
                maxWidth: "900px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#6b6760", fontSize: "18px" }}>jieanbook.com/guides</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoSansTC", data: fontData, weight: 400 },
        { name: "NotoSansTC", data: fontBoldData, weight: 700 },
      ],
    }
  );
}
