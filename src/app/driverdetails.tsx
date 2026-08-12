import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DriverDetails() {
  const router = useRouter();

  const {
    rideId,
    driverId,
    driverName,
    vehicle,
    vehicleNumber,
    rating,
  } = useLocalSearchParams<{
    rideId?: string;
    driverId?: string;
    driverName?: string;
    vehicle?: string;
    vehicleNumber?: string;
    rating?: string;
  }>();

  const displayDriverName = driverName || "Driver";
  const displayVehicle = vehicle || "Vehicle";
  const displayVehicleNumber = vehicleNumber || "Not available";
  const displayRating = rating || "5.0";

  const handleContinue = () => {
    router.push({
  pathname: "/rideprogress" as any,
  params: {
    rideId: rideId || "",
    driverId: driverId || "",
    driverName: displayDriverName,
    vehicle: displayVehicle,
    vehicleNumber: displayVehicleNumber,
  },
});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Details</Text>
      </View>

      <View style={styles.content}>
        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayDriverName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{displayDriverName}</Text>

            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{displayRating}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Vehicle</Text>
            <Text style={styles.value}>{displayVehicle}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Number</Text>
            <Text style={styles.value}>{displayVehicleNumber}</Text>
          </View>
        </View>

        {/* Ride Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ride ID</Text>
            <Text style={styles.valueSmall}>
              {rideId || "Not available"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Driver ID</Text>
            <Text style={styles.valueSmall}>
              {driverId || "Not available"}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusDot} />

          <View>
            <Text style={styles.statusTitle}>Driver Assigned</Text>
            <Text style={styles.statusText}>
              Your driver has accepted the ride.
            </Text>
          </View>
        </View>
      </View>

      {/* Continue */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Track Ride</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
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

  driverCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
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

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },

  driverInfo: {
    flex: 1,
  },

  driverName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  star: {
    color: "#F59E0B",
    fontSize: 18,
    marginRight: 5,
  },

  rating: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 15,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  label: {
    fontSize: 15,
    color: "#6B7280",
  },

  value: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },

  valueSmall: {
    fontSize: 12,
    color: "#374151",
    maxWidth: "60%",
    textAlign: "right",
  },

  statusCard: {
    marginTop: 18,
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    marginRight: 12,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
  },

  statusText: {
    marginTop: 3,
    fontSize: 13,
    color: "#047857",
  },

  bottomContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  button: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});