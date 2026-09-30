import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import RiderMap from "../components/RiderMap.web";

export default function RideProgress() {
  const router = useRouter();

  const { rideId } = useLocalSearchParams<{
    rideId?: string;
  }>();

  // =========================================================
  // RIDE STATUS
  // =========================================================

  const [rideStatus, setRideStatus] = useState("requested");

  // =========================================================
  // DRIVER INFORMATION
  // =========================================================

  const [driverId, setDriverId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // =========================================================
  // PICKUP LOCATION
  // =========================================================

  const [pickupLatitude, setPickupLatitude] =
    useState<number | null>(null);

  const [pickupLongitude, setPickupLongitude] =
    useState<number | null>(null);

  const [pickupLocation, setPickupLocation] =
    useState("");

  // =========================================================
  // DROP LOCATION
  // =========================================================

  const [dropoffLatitude, setDropoffLatitude] =
    useState<number | null>(null);

  const [dropoffLongitude, setDropoffLongitude] =
    useState<number | null>(null);

  const [dropoffLocation, setDropoffLocation] =
    useState("");

  // =========================================================
  // DRIVER LIVE LOCATION
  // =========================================================

  const [driverLatitude, setDriverLatitude] =
    useState<number | null>(null);

  const [driverLongitude, setDriverLongitude] =
    useState<number | null>(null);

  // =========================================================
  // FIRESTORE LISTENER
  // =========================================================

  useEffect(() => {
    if (!rideId) {
      console.log("No rideId received.");
      return;
    }

    let unsubscribeRide: (() => void) | null =
      null;

    console.log(
      "Preparing RideProgress listener:",
      rideId
    );

    // ---------------------------------------------------------
    // Wait for Firebase authentication state.
    //
    // This is important because after payment we call
    // signOut(auth). The RideProgress Firestore listener must
    // stop immediately when the rider is logged out.
    // ---------------------------------------------------------

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          // ---------------------------------------------------
          // Stop any previous ride listener first.
          // ---------------------------------------------------

          if (unsubscribeRide) {
            console.log(
              "Stopping existing RideProgress listener."
            );

            unsubscribeRide();
            unsubscribeRide = null;
          }

          // ---------------------------------------------------
          // Rider has logged out.
          // Do NOT start a Firestore listener.
          // ---------------------------------------------------

          if (!user) {
            console.log(
              "RideProgress: rider is logged out. Firestore listener stopped."
            );

            return;
          }

          console.log(
            "RideProgress authenticated rider:",
            user.uid
          );

          console.log(
            "Starting RideProgress listener:",
            rideId
          );

          const rideRef = doc(
            db,
            "rides",
            rideId
          );

          unsubscribeRide =
            onSnapshot(
              rideRef,
              (snapshot) => {
                if (!snapshot.exists()) {
                  console.log(
                    "Ride document does not exist."
                  );
                  return;
                }

                const ride =
                  snapshot.data();

                console.log(
                  "RideProgress Firestore update:",
                  ride
                );

                // =============================================
                // RIDE STATUS
                // =============================================

                if (ride.status) {
                  setRideStatus(
                    String(ride.status)
                  );

                  console.log(
                    "RIDE STATUS UPDATED:",
                    ride.status
                  );
                }

                // =============================================
                // DRIVER INFORMATION
                // =============================================

                if (ride.driverId) {
                  setDriverId(
                    String(
                      ride.driverId
                    )
                  );
                }

                if (ride.driverName) {
                  setDriverName(
                    String(
                      ride.driverName
                    )
                  );
                }

                if (ride.vehicle) {
                  setVehicle(
                    String(
                      ride.vehicle
                    )
                  );
                }

                if (ride.vehicleName) {
                  setVehicle(
                    String(
                      ride.vehicleName
                    )
                  );
                }

                if (ride.vehicleNumber) {
                  setVehicleNumber(
                    String(
                      ride.vehicleNumber
                    )
                  );
                }

                // =============================================
                // PICKUP LOCATION
                // =============================================

                if (
                  typeof ride.pickupLatitude ===
                  "number"
                ) {
                  setPickupLatitude(
                    ride.pickupLatitude
                  );
                }

                if (
                  typeof ride.pickupLongitude ===
                  "number"
                ) {
                  setPickupLongitude(
                    ride.pickupLongitude
                  );
                }

                if (ride.pickupLocation) {
                  setPickupLocation(
                    String(
                      ride.pickupLocation
                    )
                  );
                }

                // =============================================
                // DROP LOCATION
                // =============================================

                if (
                  typeof ride.dropLatitude ===
                  "number"
                ) {
                  setDropoffLatitude(
                    ride.dropLatitude
                  );
                }

                if (
                  typeof ride.dropLongitude ===
                  "number"
                ) {
                  setDropoffLongitude(
                    ride.dropLongitude
                  );
                }

                if (ride.dropLocation) {
                  setDropoffLocation(
                    String(
                      ride.dropLocation
                    )
                  );
                }

                // =============================================
                // DRIVER LIVE LOCATION
                // =============================================

                if (
                  typeof ride.driverLatitude ===
                    "number" &&
                  typeof ride.driverLongitude ===
                    "number"
                ) {
                  setDriverLatitude(
                    ride.driverLatitude
                  );

                  setDriverLongitude(
                    ride.driverLongitude
                  );

                  console.log(
                    "LIVE DRIVER LOCATION:",
                    ride.driverLatitude,
                    ride.driverLongitude
                  );
                }
              },
              (error) => {
                // Do not use console.error here.
                // Permission errors can occur during logout
                // while Firebase is changing auth state.
                console.log(
                  "RideProgress Firestore listener error:",
                  error?.code ||
                    error?.message
                );
              }
            );
        }
      );

    // ---------------------------------------------------------
    // Cleanup both the auth listener and ride listener.
    // ---------------------------------------------------------

    return () => {
      console.log(
        "Cleaning up RideProgress listeners."
      );

      unsubscribeAuth();

      if (unsubscribeRide) {
        unsubscribeRide();
        unsubscribeRide = null;
      }
    };
  }, [rideId]);

  // =========================================================
  // PAYMENT
  // =========================================================

  const handlePayment = () => {
    router.push({
      pathname: "/payment" as any,
      params: {
        rideId: rideId || "",
        driverId: driverId || "",
      },
    });
  };

  // =========================================================
  // DISPLAY VALUES
  // =========================================================

  const displayDriverName =
    driverName || "Driver";

  const displayVehicle =
    vehicle || "Vehicle";

  const displayVehicleNumber =
    vehicleNumber || "Not available";

  // =========================================================
  // STATUS HELPERS
  // =========================================================

  const statusOrder = [
    "accepted",
    "driverArrived",
    "inProgress",
    "completed",
  ];

  const currentStatusIndex =
    statusOrder.indexOf(rideStatus);

  const isStepCompleted = (
    stepStatus: string
  ) => {
    const stepIndex =
      statusOrder.indexOf(stepStatus);

    return (
      currentStatusIndex >= stepIndex
    );
  };

  const isCurrentStep = (
    stepStatus: string
  ) => {
    return rideStatus === stepStatus;
  };

  const getStatusTitle = () => {
    switch (rideStatus) {
      case "requested":
        return "Searching for driver";

      case "accepted":
        return "Driver is coming";

      case "driverArrived":
        return "Driver has arrived";

      case "inProgress":
        return "Ride in progress";

      case "completed":
        return "Ride completed";

      default:
        return rideStatus;
    }
  };

  const getStatusDescription = () => {
    switch (rideStatus) {
      case "requested":
        return "Looking for a driver near you.";

      case "accepted":
        return "Your driver is heading to you.";

      case "driverArrived":
        return "Your driver has arrived at the pickup location.";

      case "inProgress":
        return "You are currently on your way to your destination.";

      case "completed":
        return "Your ride has been completed.";

      default:
        return "Your ride status has been updated.";
    }
  };

  // =========================================================
  // PROGRESS STEP
  // =========================================================

  const renderProgressStep = (
    stepNumber: number,
    stepStatus: string,
    title: string,
    description: string
  ) => {
    const completed =
      isStepCompleted(stepStatus);

    const current =
      isCurrentStep(stepStatus);

    return (
      <>
        <View style={styles.progressItem}>
          <View
            style={
              completed
                ? styles.completedCircle
                : current
                ? styles.activeCircle
                : styles.pendingCircle
            }
          >
            {completed ? (
              <Text style={styles.check}>
                ✓
              </Text>
            ) : current ? (
              <View
                style={styles.activeDot}
              />
            ) : (
              <Text
                style={
                  styles.pendingNumber
                }
              >
                {stepNumber}
              </Text>
            )}
          </View>

          <View style={styles.progressInfo}>
            <Text
              style={
                completed || current
                  ? styles.progressTitle
                  : styles.pendingTitle
              }
            >
              {title}
            </Text>

            <Text style={styles.progressText}>
              {description}
            </Text>
          </View>
        </View>

        {stepNumber < 4 && (
          <View
            style={
              completed
                ? styles.progressLineCompleted
                : styles.progressLine
            }
          />
        )}
      </>
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/bookride");
              }
            }}
          >
            <Text style={styles.backButtonText}>
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={styles.headerTitle}
          >
            Ride Progress
          </Text>
        </View>

        <View style={styles.content}>

          {/* =====================================================
              CURRENT STATUS
          ===================================================== */}

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Text
                style={styles.statusIconText}
              >
                {rideStatus === "completed"
                  ? "✅"
                  : rideStatus === "inProgress"
                  ? "🚕"
                  : rideStatus ===
                    "driverArrived"
                  ? "📍"
                  : "🚗"}
              </Text>
            </View>

            <View style={styles.statusInfo}>
              <Text
                style={styles.statusTitle}
              >
                {getStatusTitle()}
              </Text>

              <Text
                style={
                  styles.statusDescription
                }
              >
                {getStatusDescription()}
              </Text>
            </View>
          </View>

          {/* =====================================================
              DRIVER
          ===================================================== */}

          {driverId !== "" && (
            <View style={styles.card}>
              <Text
                style={styles.sectionTitle}
              >
                Your Driver
              </Text>

              <View
                style={styles.driverRow}
              >
                <View
                  style={styles.avatar}
                >
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {displayDriverName
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View
                  style={styles.driverInfo}
                >
                  <Text
                    style={
                      styles.driverName
                    }
                  >
                    {displayDriverName}
                  </Text>

                  <Text
                    style={styles.vehicle}
                  >
                    {displayVehicle}
                  </Text>

                  <Text
                    style={
                      styles.vehicleNumber
                    }
                  >
                    {displayVehicleNumber}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* =====================================================
              RIDE DETAILS
          ===================================================== */}

          <View style={styles.card}>
            <Text
              style={styles.sectionTitle}
            >
              Ride Details
            </Text>

            <View style={styles.infoRow}>
              <Text
                style={styles.label}
              >
                Ride ID
              </Text>

              <Text
                style={styles.value}
              >
                {rideId ||
                  "Not available"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text
                style={styles.label}
              >
                Pickup
              </Text>

              <Text
                style={styles.value}
              >
                {pickupLocation ||
                  "Not available"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text
                style={styles.label}
              >
                Destination
              </Text>

              <Text
                style={styles.value}
              >
                {dropoffLocation ||
                  "Not available"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text
                style={styles.label}
              >
                Driver ID
              </Text>

              <Text
                style={styles.value}
              >
                {driverId ||
                  "Not available"}
              </Text>
            </View>
          </View>

          {/* =====================================================
              LIVE DRIVER LOCATION
          ===================================================== */}

          <View style={styles.card}>
            <Text
              style={styles.sectionTitle}
            >
              Driver Location
            </Text>

            {driverLatitude !== null &&
            driverLongitude !== null ? (
              <View>
                <View
                  style={
                    styles.locationStatus
                  }
                >
                  <View
                    style={styles.greenDot}
                  />

                  <Text
                    style={
                      styles.locationStatusText
                    }
                  >
                    Driver location is live
                  </Text>
                </View>

                <View
                  style={
                    styles.coordinateBox
                  }
                >
                  <Text
                    style={
                      styles.coordinateLabel
                    }
                  >
                    Latitude
                  </Text>

                  <Text
                    style={
                      styles.coordinateValue
                    }
                  >
                    {driverLatitude.toFixed(
                      6
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.coordinateBox
                  }
                >
                  <Text
                    style={
                      styles.coordinateLabel
                    }
                  >
                    Longitude
                  </Text>

                  <Text
                    style={
                      styles.coordinateValue
                    }
                  >
                    {driverLongitude.toFixed(
                      6
                    )}
                  </Text>
                </View>
              </View>
            ) : (
              <View
                style={
                  styles.waitingLocation
                }
              >
                <Text
                  style={
                    styles.waitingText
                  }
                >
                  Waiting for driver's
                  location...
                </Text>
              </View>
            )}
          </View>

          {/* =====================================================
              LIVE MAP
          ===================================================== */}

          <View style={styles.mapCard}>
            <Text
              style={styles.sectionTitle}
            >
              Live Map
            </Text>

            {pickupLatitude !== null &&
            pickupLongitude !== null ? (
              <RiderMap
                latitude={
                  pickupLatitude
                }
                longitude={
                  pickupLongitude
                }
                dropoffLatitude={
                  dropoffLatitude
                }
                dropoffLongitude={
                  dropoffLongitude
                }
                pickupLocation={
                  pickupLocation
                }
                dropoffLocation={
                  dropoffLocation
                }
                driverLatitude={
                  driverLatitude
                }
                driverLongitude={
                  driverLongitude
                }
                mapRef={null}
              />
            ) : (
              <View
                style={
                  styles.waitingMap
                }
              >
                <Text
                  style={
                    styles.waitingText
                  }
                >
                  Loading map...
                </Text>
              </View>
            )}
          </View>

          {/* =====================================================
              RIDE STATUS
          ===================================================== */}

          <View style={styles.card}>
            <Text
              style={styles.sectionTitle}
            >
              Ride Status
            </Text>

            {renderProgressStep(
              1,
              "accepted",
              "Driver accepted",
              "Your driver accepted the ride"
            )}

            {renderProgressStep(
              2,
              "driverArrived",
              "Driver arrived",
              "Your driver has arrived at the pickup location"
            )}

            {renderProgressStep(
              3,
              "inProgress",
              "Ride in progress",
              "You are travelling to your destination"
            )}

            {renderProgressStep(
              4,
              "completed",
              "Ride completed",
              "Your ride has been completed"
            )}
          </View>

          {/* =====================================================
              PAYMENT
          ===================================================== */}

          {rideStatus === "completed" && (
            <View style={styles.paymentCard}>
              <Text
                style={
                  styles.paymentTitle
                }
              >
                Ride Completed
              </Text>

              <Text
                style={
                  styles.paymentText
                }
              >
                Your ride is complete.
                You can proceed to payment.
              </Text>

              <TouchableOpacity
                style={styles.button}
                onPress={
                  handlePayment
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  💳 Proceed to Payment
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    padding: 20,
  },

  // =========================================================
  // STATUS CARD
  // =========================================================

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

  // =========================================================
  // CARDS
  // =========================================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 18,
  },

  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 18,
    overflow: "hidden",
  },

  paymentCard: {
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

  // =========================================================
  // DRIVER
  // =========================================================

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

  // =========================================================
  // RIDE DETAILS
  // =========================================================

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
    maxWidth: "30%",
  },

  value: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },

  // =========================================================
  // DRIVER LOCATION
  // =========================================================

  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#16A34A",
    marginRight: 8,
  },

  locationStatusText: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "600",
  },

  coordinateBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  coordinateLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  coordinateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  waitingLocation: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 15,
  },

  waitingMap: {
    height: 350,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  waitingText: {
    fontSize: 14,
    color: "#6B7280",
  },

  // =========================================================
  // PROGRESS
  // =========================================================

  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  progressInfo: {
    flex: 1,
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

  progressLineCompleted: {
    height: 25,
    width: 2,
    backgroundColor: "#10B981",
    marginLeft: 15,
  },

  // =========================================================
  // PAYMENT
  // =========================================================

  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  paymentText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 15,
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