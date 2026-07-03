import path from "path";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";

Font.register({
  family: "NotoSansTC",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/NotoSansTC-Regular.otf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "src/fonts/NotoSansTC-Bold.otf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: "#111827", fontFamily: "NotoSansTC", backgroundColor: "#ffffff" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  headerLeft: { flexDirection: "column" },
  headerLabel: { fontSize: 8, color: "#9ca3af", letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, color: "#111827" },
  headerRight: { flexDirection: "column", alignItems: "flex-end" },
  dateLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 3 },
  dateValue: { fontSize: 10, color: "#374151", fontWeight: 700 },

  fromToRow: { flexDirection: "row", gap: 32, marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  fromToCol: { flex: 1 },
  fromToLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 4 },
  fromToValue: { fontSize: 10, color: "#1f2937", fontWeight: 700 },

  amountWrapper: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  amountBox: { width: 220 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalDivider: { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 6 },
  grandLabel: { fontSize: 12, fontWeight: 700, color: "#111827" },
  grandValue: { fontSize: 12, fontWeight: 700, color: "#111827" },

  bankSection: { marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  bankLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 8 },
  bankRow: { flexDirection: "row", marginBottom: 4 },
  bankRowLabel: { fontSize: 9, color: "#9ca3af", width: 60 },
  bankRowValue: { fontSize: 10, color: "#1f2937", fontWeight: 700 },
});

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function formatDate(date: Date) {
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
}

const kindLabel: Record<string, string> = {
  FULL: "全額請款",
  DEPOSIT: "訂金請款",
  FINAL: "尾款請款",
};

interface BankInfo {
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  bankAccountHolder?: string | null;
}

interface ReceiptPdfProps {
  quoteTitle: string;
  clientName: string;
  freelancerName: string;
  issueDate: Date;
  dueDate?: Date | null;
  kind: string;
  amount: number;
  bankInfo?: BankInfo | null;
}

function ReceiptPdfDocument({ quoteTitle, clientName, freelancerName, issueDate, dueDate, kind, amount, bankInfo }: ReceiptPdfProps) {
  const hasBankInfo = bankInfo && (bankInfo.bankName || bankInfo.bankAccount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>{kindLabel[kind] ?? "請款單"}</Text>
            <Text style={styles.title}>{quoteTitle}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateLabel}>開立日期</Text>
            <Text style={styles.dateValue}>{formatDate(issueDate)}</Text>
          </View>
        </View>

        <View style={styles.fromToRow}>
          <View style={styles.fromToCol}>
            <Text style={styles.fromToLabel}>提供方</Text>
            <Text style={styles.fromToValue}>{freelancerName}</Text>
          </View>
          <View style={styles.fromToCol}>
            <Text style={styles.fromToLabel}>給</Text>
            <Text style={styles.fromToValue}>{clientName}</Text>
          </View>
          {dueDate && (
            <View style={styles.fromToCol}>
              <Text style={styles.fromToLabel}>付款截止日</Text>
              <Text style={styles.fromToValue}>{formatDate(dueDate)}</Text>
            </View>
          )}
        </View>

        <View style={styles.amountWrapper}>
          <View style={styles.amountBox}>
            <View style={styles.totalDivider} />
            <View style={styles.amountRow}>
              <Text style={styles.grandLabel}>應付金額</Text>
              <Text style={styles.grandValue}>{currency.format(amount)}</Text>
            </View>
          </View>
        </View>

        {hasBankInfo && (
          <View style={styles.bankSection}>
            <Text style={styles.bankLabel}>收款帳戶</Text>
            {bankInfo?.bankName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankRowLabel}>銀行</Text>
                <Text style={styles.bankRowValue}>
                  {bankInfo.bankName}
                  {bankInfo.bankBranch ? ` ${bankInfo.bankBranch}` : ""}
                </Text>
              </View>
            )}
            {bankInfo?.bankAccount && (
              <View style={styles.bankRow}>
                <Text style={styles.bankRowLabel}>帳號</Text>
                <Text style={styles.bankRowValue}>{bankInfo.bankAccount}</Text>
              </View>
            )}
            {bankInfo?.bankAccountHolder && (
              <View style={styles.bankRow}>
                <Text style={styles.bankRowLabel}>戶名</Text>
                <Text style={styles.bankRowValue}>{bankInfo.bankAccountHolder}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(props: ReceiptPdfProps): Promise<Buffer> {
  return renderToBuffer(<ReceiptPdfDocument {...props} />);
}
