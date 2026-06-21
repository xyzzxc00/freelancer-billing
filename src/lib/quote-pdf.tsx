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
  page: { padding: 40, fontSize: 11, color: "#1f1d1a", fontFamily: "NotoSansTC" },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#6b6760", marginBottom: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  divider: { borderTopWidth: 1, borderTopColor: "#e3dfd5", marginVertical: 8 },
  muted: { color: "#6b6760" },
  bold: { fontWeight: 700 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
});

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

interface QuotePdfProps {
  title: string;
  clientName: string;
  freelancerName: string;
  items: { name: string; unitPrice: number; quantity: number }[];
  taxMode: TaxMode;
}

function QuotePdfDocument({ title, clientName, freelancerName, items, taxMode }: QuotePdfProps) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const breakdown = calculateTax(subtotal, taxMode);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.subtitle}>{freelancerName} 提供的報價單</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>給 {clientName}</Text>

        {items.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text>
              {item.name} × {item.quantity}
            </Text>
            <Text>{currency.format(item.unitPrice * item.quantity)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {breakdown.clientLines.map((line, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.muted}>{line.label}</Text>
            <Text style={styles.muted}>{currency.format(line.amount)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.bold}>應付金額</Text>
          <Text style={styles.bold}>{currency.format(breakdown.clientTotal)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderQuotePdf(props: QuotePdfProps): Promise<Buffer> {
  return renderToBuffer(<QuotePdfDocument {...props} />);
}
