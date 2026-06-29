import path from "path";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { calculateTax, type TaxMode } from "./tax";

Font.register({
  family: "NotoSansTC",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/NotoSansTC-Regular.otf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "src/fonts/NotoSansTC-Bold.otf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: "#111827", fontFamily: "NotoSansTC", backgroundColor: "#ffffff" },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  headerLeft: { flexDirection: "column" },
  headerLabel: { fontSize: 8, color: "#9ca3af", letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 700, color: "#111827" },
  headerRight: { flexDirection: "column", alignItems: "flex-end" },
  dateLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 3 },
  dateValue: { fontSize: 10, color: "#374151", fontWeight: 700 },

  // From/To
  fromToRow: { flexDirection: "row", gap: 32, marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  fromToCol: { flex: 1 },
  fromToLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 4 },
  fromToValue: { fontSize: 10, color: "#1f2937", fontWeight: 700 },

  // Table
  tableHeader: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginBottom: 2 },
  tableHeaderCell: { fontSize: 8, color: "#9ca3af" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.2, textAlign: "right" },
  colSubtotal: { flex: 1.2, textAlign: "right" },
  cellText: { fontSize: 10, color: "#1f2937" },
  cellMuted: { fontSize: 10, color: "#6b7280" },

  // Totals
  totalsWrapper: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsLabel: { fontSize: 10, color: "#6b7280" },
  totalsValue: { fontSize: 10, color: "#6b7280" },
  totalDivider: { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 6 },
  grandLabel: { fontSize: 12, fontWeight: 700, color: "#111827" },
  grandValue: { fontSize: 12, fontWeight: 700, color: "#111827" },
});

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function formatDate(date: Date) {
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
}

interface QuotePdfProps {
  title: string;
  clientName: string;
  freelancerName: string;
  quoteDate: Date;
  items: { name: string; unitPrice: number; quantity: number }[];
  taxMode: TaxMode;
}

function QuotePdfDocument({ title, clientName, freelancerName, quoteDate, items, taxMode }: QuotePdfProps) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const breakdown = calculateTax(subtotal, taxMode);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>報價單</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateLabel}>報價日期</Text>
            <Text style={styles.dateValue}>{formatDate(quoteDate)}</Text>
          </View>
        </View>

        {/* From / To */}
        <View style={styles.fromToRow}>
          <View style={styles.fromToCol}>
            <Text style={styles.fromToLabel}>提供方</Text>
            <Text style={styles.fromToValue}>{freelancerName}</Text>
          </View>
          <View style={styles.fromToCol}>
            <Text style={styles.fromToLabel}>給</Text>
            <Text style={styles.fromToValue}>{clientName}</Text>
          </View>
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colName]}>項目</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>數量</Text>
          <Text style={[styles.tableHeaderCell, styles.colPrice]}>單價</Text>
          <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>小計</Text>
        </View>

        {/* Table rows */}
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colName]}>{item.name}</Text>
            <Text style={[styles.cellMuted, styles.colQty]}>{item.quantity}</Text>
            <Text style={[styles.cellMuted, styles.colPrice]}>{currency.format(item.unitPrice)}</Text>
            <Text style={[styles.cellText, styles.colSubtotal]}>{currency.format(item.unitPrice * item.quantity)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBox}>
            {breakdown.clientLines.map((line, i) => (
              <View key={i} style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{line.label}</Text>
                <Text style={styles.totalsValue}>{currency.format(line.amount)}</Text>
              </View>
            ))}
            <View style={styles.totalDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.grandLabel}>應付金額</Text>
              <Text style={styles.grandValue}>{currency.format(breakdown.clientTotal)}</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
}

export async function renderQuotePdf(props: QuotePdfProps): Promise<Buffer> {
  return renderToBuffer(<QuotePdfDocument {...props} />);
}
