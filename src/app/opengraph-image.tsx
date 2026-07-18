import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "接案帳本 — 給自由接案者與一人公司的業務工具";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const brand = "接案帳本";
const line1 = "接案的錢，";
const line2 = "一條線管好";
const sub = "報價 · 簽署 · 訂金 · 催款 · 報稅";

export default async function Image() {
  const [fontData, fontBoldData] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/NotoSansTC-Regular.otf")),
    readFile(join(process.cwd(), "src/fonts/NotoSansTC-Bold.otf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fdfcfa",
          padding: "72px 80px",
          fontFamily: "NotoSansTC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#d85a30",
              color: "#fbece6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
            }}
          >
            接
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#1f1d1a" }}>{brand}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "66px", color: "#1f1d1a", lineHeight: 1.3, fontWeight: 700 }}>
            {line1}
          </div>
          <div style={{ display: "flex", fontSize: "66px", color: "#d85a30", lineHeight: 1.3, fontWeight: 700 }}>
            {line2}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", fontSize: "30px", color: "#6b6760" }}>{sub}</div>
          <div style={{ display: "flex", fontSize: "26px", color: "#a8a399" }}>
            jieanbook.com
          </div>
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
