import { useLocalSearchParams, useRouter } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PaymentSuccess() {
  const router = useRouter();

  const { rideId, paymentId, amount } = useLocalSearchParams<{
    rideId?: string;
    paymentId?: string;
    amount?: string;
  }>();

  const displayAmount = amount || "250";

  const handleDone = () => {
    router.replace("/bookride");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>Payment Successful!</Text>

        <Text style={styles.subtitle}>
          Your payment has been completed successfully.
        </Text>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Paid</Text>

          <Text style={styles.amount}>
            ₹{displayAmount}
          </Text>
        </View>

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>
            Payment Details
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment ID</Text>

            <Text style={styles.value}>
              {paymentId || "Processing"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ride ID</Text>

            <Text style={styles.value}>
              {rideId || "Not available"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>

            <Text style={styles.successText}>
              PAID
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Currency</Text>

            <Text style={styles.value}>
              INR
            </Text>
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>✓</Text>

          <Text style={styles.message}>
            Thank you! Your ride payment has been recorded.
          </Text>
        </View>
      </View>

      {/* Done Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleDone}
        >
          <Text style={styles.buttonText}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },

  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 52,
    fontWeight: "700",
  },

  title: {
    marginTop: 22,
    fontSize: 27,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  amountCard: {
    width: "100%",
    marginTop: 28,
    padding: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  amount: {
    marginTop: 6,
    fontSize: 38,
    fontWeight: "800",
    color: "#111827",
  },

  detailsCard: {
    width: "100%",
    marginTop: 18,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  label: {
    fontSize: 13,
    color: "#6B7280",
  },

  value: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    maxWidth: "60%",
    textAlign: "right",
  },

  successText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#059669",
  },

  messageCard: {
    width: "100%",
    marginTop: 18,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    flexDirection: "row",
    alignItems: "center",
  },

  messageIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 25,
    fontWeight: "700",
    marginRight: 10,
  },

  message: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    lineHeight: 19,
  },

  bottomContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  button: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});