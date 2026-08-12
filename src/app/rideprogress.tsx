import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RideProgress() {
  const router = useRouter();

  const {
    rideId,
    driverId,
    driverName,
    vehicle,
    vehicleNumber,
  } = useLocalSearchParams<{
    rideId?: string;
    driverId?: string;
    driverName?: string;
    vehicle?: string;
    vehicleNumber?: string;
  }>();

  const [rideStatus, setRideStatus] = useState("Driver is coming");

  const displayDriverName = driverName || "Driver";
  const displayVehicle = vehicle || "Vehicle";
  const displayVehicleNumber = vehicleNumber || "Not available";

  const handleRideCompleted = () => {
    setRideStatus("Ride completed");

    router.push({
  pathname: "/payment" as any,
  params: {
    rideId: rideId || "",
    driverId: driverId || "",
  },
});
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride Progress</Text>
      </View>

      <View style={styles.content}>
        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Text style={styles.statusIconText}>🚗</Text>
          </View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{rideStatus}</Text>

            <Text style={styles.statusDescription}>
              Your ride is currently in progress.
            </Text>
          </View>
        </View>

        {/* Driver */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Driver</Text>

          <View style={styles.driverRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayDriverName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {displayDriverName}
              </Text>

              <Text style={styles.vehicle}>
                {displayVehicle}
              </Text>

              <Text style={styles.vehicleNumber}>
                {displayVehicleNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Ride Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ride Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ride ID</Text>

            <Text style={styles.value}>
              {rideId || "Not available"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Driver ID</Text>

            <Text style={styles.value}>
              {driverId || "Not available"}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ride Status</Text>

          <View style={styles.progressItem}>
            <View style={styles.completedCircle}>
              <Text style={styles.check}>✓</Text>
            </View>

            <View>
              <Text style={styles.progressTitle}>
                Driver accepted
              </Text>

              <Text style={styles.progressText}>
                Your driver accepted the ride
              </Text>
            </View>
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressItem}>
            <View style={styles.activeCircle}>
              <View style={styles.activeDot} />
            </View>

            <View>
              <Text style={styles.progressTitle}>
                Driver coming
              </Text>

              <Text style={styles.progressText}>
                Your driver is heading to you
              </Text>
            </View>
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressItem}>
            <View style={styles.pendingCircle}>
              <Text style={styles.pendingNumber}>3</Text>
            </View>

            <View>
              <Text style={styles.pendingTitle}>
                Ride in progress
              </Text>

              <Text style={styles.progressText}>
                Waiting for ride to start
              </Text>
            </View>
          </View>

          <View style={styles.progressLine} />

          <View style={styles.progressItem}>
            <View style={styles.pendingCircle}>
              <Text style={styles.pendingNumber}>4</Text>
            </View>

            <View>
              <Text style={styles.pendingTitle}>
                Ride completed
              </Text>

              <Text style={styles.progressText}>
                Payment will be available after completion
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Temporary test button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleRideCompleted}
        >
          <Text style={styles.buttonText}>
            Test Ride Completed
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

  statusCard: {
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

  statusIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  statusIconText: {
    fontSize: 28,
  },

  statusInfo: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  statusDescription: {
    marginTop: 5,
    fontSize: 13,
    color: "#6B7280",
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

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },

  driverInfo: {
    flex: 1,
  },

  driverName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  vehicle: {
    marginTop: 4,
    fontSize: 14,
    color: "#4B5563",
  },

  vehicleNumber: {
    marginTop: 2,
    fontSize: 14,
    color: "#6B7280",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  label: {
    fontSize: 14,
    color: "#6B7280",
  },

  value: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  completedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  check: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  activeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },

  pendingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  pendingNumber: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  pendingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },

  progressText: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  progressLine: {
    height: 25,
    width: 2,
    backgroundColor: "#D1D5DB",
    marginLeft: 15,
  },

  bottomContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});