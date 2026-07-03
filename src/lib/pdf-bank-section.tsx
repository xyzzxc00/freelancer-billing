import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  bankSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  bankLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 8 },
  bankRow: { flexDirection: "row", marginBottom: 4 },
  bankRowLabel: { fontSize: 9, color: "#9ca3af", width: 60 },
  bankRowValue: { fontSize: 10, color: "#1f2937", fontWeight: 700 },
});

export interface BankInfo {
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  bankAccountHolder?: string | null;
}

export function BankInfoSection({ bankInfo }: { bankInfo?: BankInfo | null }) {
  if (!bankInfo || (!bankInfo.bankName && !bankInfo.bankAccount)) return null;

  return (
    <View style={styles.bankSection}>
      <Text style={styles.bankLabel}>收款帳戶</Text>
      {bankInfo.bankName && (
        <View style={styles.bankRow}>
          <Text style={styles.bankRowLabel}>銀行</Text>
          <Text style={styles.bankRowValue}>
            {bankInfo.bankName}
            {bankInfo.bankBranch ? ` ${bankInfo.bankBranch}` : ""}
          </Text>
        </View>
      )}
      {bankInfo.bankAccount && (
        <View style={styles.bankRow}>
          <Text style={styles.bankRowLabel}>帳號</Text>
          <Text style={styles.bankRowValue}>{bankInfo.bankAccount}</Text>
        </View>
      )}
      {bankInfo.bankAccountHolder && (
        <View style={styles.bankRow}>
          <Text style={styles.bankRowLabel}>戶名</Text>
          <Text style={styles.bankRowValue}>{bankInfo.bankAccountHolder}</Text>
        </View>
      )}
    </View>
  );
}
