import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
export default function Payment() {
  const router = useRouter();

  const { rideId, amount } = useLocalSearchParams<{
    rideId?: string;
    amount?: string;
  }>();

  const [loading, setLoading] = useState(false);

  const displayAmount = amount || "250";

  const handlePayNow = async () => {
  try {
    if (!rideId) {
      Alert.alert("Error", "Ride ID is missing.");
      return;
    }

    setLoading(true);

    // 1. Create Razorpay order
    const response = await fetch(
      "YOUR_API_BASE_URL/api/Payment/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId: rideId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to create payment order."
      );
    }

    console.log("Payment order created:", data);

    // 2. Open Razorpay Checkout
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: data.currency || "INR",
      name: "Ride App",
      description: "Ride Payment",
      order_id: data.orderId,

      prefill: {
        name: "Rider",
      },

      theme: {
        color: "#2563EB",
      },
    };

    const paymentData = await RazorpayCheckout.open(options);

    console.log("Razorpay success:", paymentData);

    // 3. Verify payment with backend
    const verifyResponse = await fetch(
      "YOUR_API_BASE_URL/api/Payment/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: data.paymentId,
          razorpayOrderId: paymentData.razorpay_order_id,
          razorpayPaymentId: paymentData.razorpay_payment_id,
          razorpaySignature: paymentData.razorpay_signature,
        }),
      }
    );

    const verifyData = await verifyResponse.json();

    console.log("Payment verification:", verifyData);

    if (!verifyResponse.ok) {
      throw new Error(
        verifyData?.message || "Payment verification failed."
      );
    }

    // 4. Payment is genuinely verified
    router.replace({
      pathname: "/paymentsuccess" as any,
      params: {
        rideId: rideId,
        paymentId: data.paymentId,
        razorpayPaymentId: paymentData.razorpay_payment_id,
      },
    });

  } catch (error: any) {
    console.error("Payment error:", error);

    Alert.alert(
      "Payment Failed",
      error?.description ||
        error?.message ||
        "Payment was cancelled or failed."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <View style={styles.content}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Ride Fare</Text>

          <Text style={styles.amount}>
            ₹{displayAmount}
          </Text>

          <Text style={styles.amountDescription}>
            Amount payable for your completed ride
          </Text>
        </View>

        {/* Ride Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Ride Details
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ride ID</Text>

            <Text style={styles.value}>
              {rideId || "Not available"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ride Fare</Text>

            <Text style={styles.value}>
              ₹{displayAmount}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Currency</Text>

            <Text style={styles.value}>
              INR
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <View style={styles.paymentMethod}>
            <View style={styles.paymentIcon}>
              <Text style={styles.paymentIconText}>₹</Text>
            </View>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>
                Online Payment
              </Text>

              <Text style={styles.paymentDescription}>
                Secure payment through Razorpay
              </Text>
            </View>

            <View style={styles.selected}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={styles.securityCard}>
          <Text style={styles.lock}>🔒</Text>

          <Text style={styles.securityText}>
            Your payment is securely processed.
            We do not store your card details.
          </Text>
        </View>
      </View>

      {/* Pay Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            loading && styles.disabledButton,
          ]}
          onPress={handlePayNow}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>
            {loading
              ? "Processing..."
              : `Pay ₹${displayAmount}`}
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

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    flex: 1,
    padding: 20,
  },

  amountCard: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
  },

  amountLabel: {
    color: "#DBEAFE",
    fontSize: 15,
  },

  amount: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "800",
    marginTop: 8,
  },

  amountDescription: {
    color: "#DBEAFE",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  label: {
    fontSize: 14,
    color: "#6B7280",
  },

  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
  },

  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  paymentIconText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563EB",
  },

  paymentInfo: {
    flex: 1,
    marginLeft: 14,
  },

  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  paymentDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  selected: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  securityCard: {
    marginTop: 18,
    padding: 15,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  lock: {
    fontSize: 20,
    marginRight: 10,
  },

  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#065F46",
    lineHeight: 18,
  },

  bottomContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  payButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  payButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});