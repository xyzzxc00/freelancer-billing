// 集中管理伺服器端環境變數。
// 使用 getter 讓驗證「延遲到實際存取時」才發生，避免 build / edge 階段
// 因為某些變數尚未注入就整個炸掉；真的缺變數時給出清楚的中文錯誤訊息。

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少必要的環境變數 ${name}，請在 .env 或部署平台（Vercel）設定`);
  }
  return value;
}

export const serverEnv = {
  /** 意見回饋與系統告警的收件信箱 */
  get adminEmail(): string {
    return required("ADMIN_EMAIL");
  },
};
