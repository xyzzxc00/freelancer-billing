import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const fontData = await readFile(
    join(process.cwd(), "src/fonts/NotoSansTC-Regular.otf")
  );
  const fontBoldData = await readFile(
    join(process.cwd(), "src/fonts/NotoSansTC-Bold.otf")
  );

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
            <span style={{ color: "#fff", fontSize: "18px", fontWeight: 700 }}>帳</span>
          </div>
          <span style={{ color: "#fdfcfa", fontSize: "20px", fontWeight: 400 }}>
            接案帳本
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              color: "#fdfcfa",
              fontSize: "52px",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            自由接案者知識庫
          </div>
          <div style={{ display: "flex", color: "#9c9589", fontSize: "24px", lineHeight: 1.5 }}>
            報價、記帳、稅務、收款——接案必知的實用知識
          </div>
        </div>

        <div style={{ display: "flex" }}>
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
