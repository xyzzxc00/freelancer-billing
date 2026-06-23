import { ImageResponse } from "next/og";

export const alt = "接案帳本 — 給自由接案者的記帳與報價工具";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og（Satori）預設不含中文字型，需自行載入。
// 用 Google Fonts 的 text 子集只抓會用到的字，檔案小、build 快。
const brand = "接案帳本";
const line1 = "讓接案的記帳與報價，";
const line2 = "都輕鬆一點";
const sub = "報價單 · 線上簽署 · 待收款追蹤 · 收支報表";
const subsetText = brand + line1 + line2 + sub;

async function loadNotoSansTC(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@700&text=${encodeURIComponent(
      text
    )}`;
    // 用桌面 UA 讓 Google 回傳 Satori 支援的 truetype（而非 woff2）
    const css = await (
      await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })
    ).text();
    const match = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/
    );
    if (!match) return null;
    return await (await fetch(match[1])).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const fontData = await loadNotoSansTC(subsetText);

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
          fontFamily: fontData ? "Noto Sans TC" : "sans-serif",
        }}
      >
        {/* 品牌列 */}
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
            }}
          >
            接
          </div>
          <div style={{ fontSize: "30px", color: "#1f1d1a" }}>{brand}</div>
        </div>

        {/* 主標 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "66px", color: "#1f1d1a", lineHeight: 1.3 }}>
            {line1}
          </div>
          <div style={{ fontSize: "66px", color: "#d85a30", lineHeight: 1.3 }}>
            {line2}
          </div>
        </div>

        {/* 副標 + 網址 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "30px", color: "#6b6760" }}>{sub}</div>
          <div style={{ fontSize: "26px", color: "#a8a399" }}>
            freelancer-billing.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans TC", data: fontData, style: "normal", weight: 700 }]
        : [],
    }
  );
}
