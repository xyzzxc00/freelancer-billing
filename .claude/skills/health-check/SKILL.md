---
name: health-check
description: 對這個 Next.js 記帳/接案系統做全面性程式碼與基礎設施健檢，涵蓋 Supabase（client 初始化、RLS、N+1/分頁）、Auth/middleware、API Routes 與 Server Actions、Resend email 整合、SEO/Search Console（sitemap、robots、metadata、JSON-LD）、前端 UI/UX（RWD、loading/error/empty states、表單驗證）、效能（next/image、client vs server component）、Vercel/CI-CD 設定。當使用者要求「健檢」「全面檢查」「review 整個專案」「看看有什麼可以優化」「audit codebase」或類似請求時使用此 skill，即使他們沒有明確列出要檢查的面向。
---

# 專案全面健檢

這個 skill 用來對本專案做一次涵蓋多面向的程式碼與基礎設施健檢，產出一份具體、可討論優先順序的報告。**只調查與回報，不要主動修改程式碼**——健檢的價值在於讓使用者自己判斷要不要動、何時動。

## 為什麼用 Explore agent 而不是自己掃

這個健檢涵蓋的範圍很廣（9 大類、數十個檔案），如果在主對話裡逐一 Read/Grep 每個面向，會把主對話的 context 塞滿大量程式碼片段，之後沒辦法跟使用者好好討論。改用一個 `Explore`（或 `general-purpose`）subagent 去做地毯式搜尋，只把「結論 + 檔案路徑 + 行號」帶回主對話，能讓報告更聚焦、也更省 token。

## 執行步驟

0. **先讀記憶裡的 `completed-optimizations.md`**（在 memory 目錄，MEMORY.md 索引有連結）。那份清單記錄了已完成的優化、已查核過的安全結論、刻意不做的項目，以及**健檢誤判陷阱**（例如：此專案的 middleware 叫 `src/proxy.ts`，Next.js 16 改名；PDF/匯出路由在 `(app)` group 下有被保護）。清單上已列的項目不要重新調查、不要再列進報告；誤判陷阱要摘要進 Explore agent 的 prompt 裡，避免 agent 誤報。
1. 用 `Agent` 工具呼叫一個 `Explore`（或 `general-purpose`，視找到的檔案複雜度而定）agent，把下方「調查範圍」整段（加上步驟 0 摘出的「已完成項目 + 誤判陷阱」）交給它作為 prompt。提醒它：
   - 只需要回報具體發現（檔案路徑 + 行號 + 簡短問題描述），不用修代碼。
   - 用條列式整理，每一大類底下列出發現，整體控制在合理長度（約 2000-2500 字），避免把整段程式碼貼回來。
2. agent 完成後，根據它的結果在主對話中整理成最終報告（見下方「報告格式」），標出優先順序，並詢問使用者想先處理哪一塊。回報前再跟 completed-optimizations 清單比對一次，agent 若還是報了已完成項目就從報告裡剔除。
3. 不要自動開始修復——這個 skill 的輸出是診斷報告，下一步交給使用者決定。
4. 修復完成、使用者確認後，把新完成的項目補進記憶裡的 `completed-optimizations.md`，讓下次健檢不重工。

## 調查範圍（交給 Explore agent 的內容）

請對這個 Next.js 記帳/接案系統做一次全面性的程式碼健檢，涵蓋以下面向，並回報具體檔案路徑 + 行號：

1. **專案結構總覽**：package.json 的主要套件（Next.js 版本、Supabase client、Resend、ORM、驗證方式等）、app 目錄下的主要路由/頁面結構。

2. **Supabase 使用方式**：
   - 找出所有 supabase client 初始化的地方，檢查 service role key 是否有洩漏到前端的風險。
   - 檢查資料庫查詢是否有 N+1 問題或缺少分頁（尤其是列表頁）。
   - 檢查 RLS migration 是否存在，以及是否有資料表缺少 RLS 保護。
   - 檢查環境變數使用方式（.env.example 是否完整對應）。

3. **驗證/Auth**：OAuth、session 管理、`src/proxy.ts` 的保護路由邏輯是否完整（此專案的 Next.js 16 已把 middleware.ts 改名為 proxy.ts，不要因為找不到 middleware.ts 就判定缺認證層）。

4. **API Routes / Server Actions**：列出所有 API routes 與主要 server actions，檢查輸入驗證、錯誤處理一致性、是否有敏感資訊洩漏。

5. **Resend (email) 整合**：呼叫位置、是否有 rate limit、錯誤處理與重試機制。

6. **SEO / Search Console**：sitemap.xml、robots.txt、metadata（title/description/og tags）、是否有結構化資料（JSON-LD）。

7. **前端 UI/UX**：
   - 響應式設計（手機版 RWD），尤其表格、表單在小螢幕的呈現。
   - loading state、error state、empty state 處理是否一致（特別注意 Suspense fallback 是否只是 `null`）。
   - 表單驗證的使用者體驗。

8. **效能**：是否使用 next/image、client component 是否有過度使用（該用 server component 卻沒用）、bundle size 相關設定。

9. **CI/CD / Vercel**：vercel.json、next.config 設定、GitHub Actions workflow 是否存在、是否有測試覆蓋。

## 報告格式

整理成這個結構回覆使用者：

```
## 健檢結果總覽
（1-2 句話總評：架構是否紮實、主要風險方向）

**🔴 高優先**
- 問題 — 位置 — 影響

**🟡 中優先**
- 問題 — 位置 — 影響

**🟢 低優先（體驗類）**
- 問題 — 位置 — 影響

**✅ 已經做得不錯，不用動**
- 列出已經妥善處理的部分，避免使用者重複檢查

（結尾詢問使用者想先處理哪一塊，不要自動開始修）
```

優先順序判斷原則：會造成資料外洩、資料遺失、寄信失敗、安全漏洞的歸高優先；影響效能或可維護性但不會出錯的歸中優先；純體驗/視覺類的歸低優先。
