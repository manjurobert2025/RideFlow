import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { loginUser } from "../../../services/authService";
import { auth, db } from "../../../services/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // =====================================================
  // FIND RIDER'S NEXT REQUIRED RIDE ACTION
  // =====================================================

  const findRideAfterLogin = async (
    riderId: string
  ) => {
    try {
      const ridesQuery = query(
        collection(db, "rides"),
        where("riderId", "==", riderId)
      );

      const snapshot = await getDocs(ridesQuery);

      if (snapshot.empty) {
        return null;
      }

      const rides = snapshot.docs
        .map((rideDoc) => ({
          id: rideDoc.id,
          ...rideDoc.data(),
        }))
        .filter(
          (ride: any) =>
            ride.status === "requested" ||
            ride.status === "accepted" ||
            ride.status === "driverArrived" ||
            ride.status === "inProgress" ||
            ride.status === "completed"
        );

      // Most recent ride first
      rides.sort(
        (a: any, b: any) => {
          const aTime =
            a.createdAt?.toMillis
              ? a.createdAt.toMillis()
              : 0;

          const bTime =
            b.createdAt?.toMillis
              ? b.createdAt.toMillis()
              : 0;

          return bTime - aTime;
        }
      );

      // ----------------------------------------------------
      // 1. Active ride
      // ----------------------------------------------------

      const activeRide = rides.find(
        (ride: any) =>
          ride.status === "requested" ||
          ride.status === "accepted" ||
          ride.status === "driverArrived" ||
          ride.status === "inProgress"
      );

      if (activeRide) {
        return activeRide;
      }

      // ----------------------------------------------------
      // 2. Completed ride with payment pending
      // ----------------------------------------------------

      const pendingPaymentRide = rides.find(
        (ride: any) =>
          ride.status === "completed" &&
          ride.paymentStatus !== "paid"
      );

      if (pendingPaymentRide) {
        return pendingPaymentRide;
      }

      return null;

    } catch (error) {
      console.log(
        "FIND RIDE AFTER LOGIN ERROR:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // NAVIGATE AFTER LOGIN
  // =====================================================

  const navigateAfterLogin = async (
    userId: string
  ) => {
    const ride =
      await findRideAfterLogin(userId);

    if (!ride) {
      router.replace("/bookride");
      return;
    }

    console.log(
      "RIDE FOUND AFTER LOGIN:",
      ride.id
    );

    console.log(
      "STATUS:",
      ride.status
    );

    console.log(
      "PAYMENT STATUS:",
      ride.paymentStatus || "pending"
    );

    // ----------------------------------------------------
    // Completed ride - payment pending
    // ----------------------------------------------------

    if (
      ride.status === "completed" &&
      ride.paymentStatus !== "paid"
    ) {
      router.replace({
        pathname: "/payment",
        params: {
          rideId: ride.id,
          amount: String(
            ride.fare ??
            ride.amount ??
            250
          ),
        },
      });

      return;
    }

    // ----------------------------------------------------
    // Requested ride
    // ----------------------------------------------------

    if (ride.status === "requested") {
      router.replace({
        pathname: "/bookride",
        params: {
          resumeRideId: ride.id,
        },
      });

      return;
    }

    // ----------------------------------------------------
    // Driver accepted / arrived / ride started
    // ----------------------------------------------------

    if (
      ride.status === "accepted" ||
      ride.status === "driverArrived" ||
      ride.status === "inProgress"
    ) {
      router.replace({
        pathname: "/rideprogress",
        params: {
          rideId: ride.id,
        },
      });

      return;
    }

    router.replace("/bookride");
  };

  // =====================================================
  // EMAIL / PASSWORD LOGIN
  // =====================================================

  const handleLogin = async () => {
    const emailAddress = email.trim();

    // ----------------------------------------------------
    // EMAIL VALIDATION
    // ----------------------------------------------------

    if (!emailAddress) {
      Alert.alert(
        "Validation",
        "Please enter your email address."
      );

      return;
    }

    // ----------------------------------------------------
    // PASSWORD VALIDATION
    // ----------------------------------------------------

    if (!password) {
      Alert.alert(
        "Validation",
        "Please enter your password."
      );

      return;
    }

    // ----------------------------------------------------
    // EMAIL FORMAT VALIDATION
    // ----------------------------------------------------

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailAddress)) {
      Alert.alert(
        "Validation",
        "Please enter a valid email address."
      );

      return;
    }

    try {
      setLoading(true);

      console.log(
        "Logging in rider:",
        emailAddress
      );

      // --------------------------------------------------
      // FIREBASE LOGIN
      // --------------------------------------------------

      const user = await loginUser(
        emailAddress,
        password
      );

      console.log(
        "Firebase login successful:",
        user.uid
      );

      // --------------------------------------------------
      // SAVE USER INFORMATION
      // --------------------------------------------------

      await AsyncStorage.setItem(
        "firebaseUid",
        user.uid
      );

      if (user.email) {
        await AsyncStorage.setItem(
          "email",
          user.email
        );
      }

      // Remove old JWT if one exists
      await AsyncStorage.removeItem("token");

      // --------------------------------------------------
      // NAVIGATE
      // --------------------------------------------------

      await navigateAfterLogin(
        user.uid
      );

    } catch (error: any) {

      // IMPORTANT:
      // Use console.log instead of console.error.
      // console.error causes the Expo Web development
      // Console Error overlay to appear.

      console.log(
        "Login error:",
        error?.code
      );

      let message =
        "Invalid email or password.";

      // --------------------------------------------------
      // FIREBASE LOGIN ERRORS
      // --------------------------------------------------

      switch (error?.code) {

        case "auth/invalid-email":
          message =
            "Please enter a valid email address.";
          break;

        case "auth/invalid-credential":
          message =
            "Invalid email or password.";
          break;

        case "auth/wrong-password":
          message =
            "Invalid email or password.";
          break;

        case "auth/user-not-found":
          message =
            "Invalid email or password.";
          break;

        case "auth/user-disabled":
          message =
            "This account has been disabled.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many login attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;

        default:
          message =
            "Invalid email or password.";
          break;
      }

      // --------------------------------------------------
      // SHOW USER-FRIENDLY MESSAGE
      // --------------------------------------------------

      Alert.alert(
        "Login Failed",
        message
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GOOGLE SIGN-IN
  // =====================================================

  const handleGoogleSignIn = async () => {
    console.log(
      "================================"
    );

    console.log(
      "GOOGLE SIGN-IN BUTTON PRESSED"
    );

    console.log(
      "Platform:",
      Platform.OS
    );

    console.log(
      "================================"
    );

    // -----------------------------------------------------
    // CURRENTLY WEB ONLY
    // -----------------------------------------------------

    if (Platform.OS !== "web") {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is currently configured for the Web version. Android Google Sign-In will be configured separately."
      );

      return;
    }

    try {
      setGoogleLoading(true);

      console.log(
        "Creating Google provider..."
      );

      const provider =
        new GoogleAuthProvider();

      // -----------------------------------------------------
      // OPEN GOOGLE SIGN-IN POPUP
      // -----------------------------------------------------

      console.log(
        "Opening Google Sign-In popup..."
      );

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      // -----------------------------------------------------
      // GOOGLE USER
      // -----------------------------------------------------

      const user = result.user;

      console.log(
        "================================"
      );

      console.log(
        "GOOGLE SIGN-IN SUCCESS"
      );

      console.log(
        "UID:",
        user.uid
      );

      console.log(
        "EMAIL:",
        user.email
      );

      console.log(
        "DISPLAY NAME:",
        user.displayName
      );

      console.log(
        "PHOTO:",
        user.photoURL
      );

      console.log(
        "================================"
      );

      // -----------------------------------------------------
      // SAVE RIDER TO FIRESTORE
      // -----------------------------------------------------

      const riderRef = doc(
        db,
        "riders",
        user.uid
      );

      await setDoc(
        riderRef,
        {
          userId: user.uid,

          fullName:
            user.displayName ||
            "Rider",

          email:
            user.email || "",

          phoneNumber: "",

          role: "Rider",

          photoURL:
            user.photoURL || "",

          authProvider: "google",

          updatedAt:
            serverTimestamp(),

          createdAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      console.log(
        "Rider Firestore document saved:",
        user.uid
      );

      // -----------------------------------------------------
      // SAVE USER INFORMATION LOCALLY
      // -----------------------------------------------------

      await AsyncStorage.setItem(
        "firebaseUid",
        user.uid
      );

      if (user.email) {
        await AsyncStorage.setItem(
          "email",
          user.email
        );
      }

      if (user.displayName) {
        await AsyncStorage.setItem(
          "fullName",
          user.displayName
        );
      }

      // Remove old JWT
      await AsyncStorage.removeItem("token");

      console.log(
        "Rider local storage updated."
      );

      // -----------------------------------------------------
      // GO TO NEXT RIDER SCREEN
      // -----------------------------------------------------

      await navigateAfterLogin(
        user.uid
      );

    } catch (error: any) {

      // Do NOT use console.error here.
      // Expected Google popup errors should not
      // trigger the Expo Web error overlay.

      console.log(
        "GOOGLE SIGN-IN ENDED"
      );

      console.log(
        "ERROR CODE:",
        error?.code
      );

      console.log(
        "ERROR MESSAGE:",
        error?.message
      );

      let message =
        "Unable to sign in with Google.";

      switch (error?.code) {

        case "auth/popup-closed-by-user":
          message =
            "Google Sign-In was cancelled.";
          break;

        case "auth/popup-timeout":
          message =
            "Google Sign-In timed out. Please try again.";
          break;

        case "auth/popup-blocked":
          message =
            "The Google Sign-In popup was blocked by the browser. Please allow popups and try again.";
          break;

        case "auth/cancelled-popup-request":
          message =
            "Another Google Sign-In request is already in progress.";
          break;

        case "auth/account-exists-with-different-credential":
          message =
            "An account already exists with this email using a different sign-in method. Please use your existing login method.";
          break;

        case "auth/operation-not-allowed":
          message =
            "Google Sign-In is not enabled in Firebase Authentication.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;

        default:
          message =
            "Unable to sign in with Google.";
          break;
      }

      Alert.alert(
        "Google Sign-In",
        message
      );

    } finally {
      setGoogleLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>

      <View style={styles.card}>

        {/* =================================================
            ICON
        ================================================= */}

        <Text style={styles.icon}>
          🚖
        </Text>

        {/* =================================================
            TITLE
        ================================================= */}

        <Text style={styles.title}>
          Rider Login
        </Text>

        <Text style={styles.subtitle}>
          Login to book your ride
        </Text>

        {/* =================================================
            EMAIL
        ================================================= */}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={
            !loading &&
            !googleLoading
          }
        />

        {/* =================================================
            PASSWORD
        ================================================= */}

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={
            !loading &&
            !googleLoading
          }
        />

        {/* =================================================
            FORGOT PASSWORD
        ================================================= */}

        <Pressable
          onPress={() =>
            router.push(
              "/auth/forgot-password"
            )
          }
          disabled={
            loading ||
            googleLoading
          }
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </Pressable>

        {/* =================================================
            LOGIN BUTTON
        ================================================= */}

        <Pressable
          style={[
            styles.button,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={
            loading ||
            googleLoading
          }
        >
          {loading ? (
            <View style={styles.loadingRow}>

              <ActivityIndicator
                color="#ffffff"
              />

              <Text
                style={styles.buttonText}
              >
                LOGGING IN...
              </Text>

            </View>
          ) : (
            <Text
              style={styles.buttonText}
            >
              LOGIN
            </Text>
          )}
        </Pressable>

        {/* =================================================
            OR
        ================================================= */}

        <View style={styles.orContainer}>

          <View
            style={styles.orLine}
          />

          <Text style={styles.orText}>
            OR
          </Text>

          <View
            style={styles.orLine}
          />

        </View>

        {/* =================================================
            GOOGLE SIGN-IN
        ================================================= */}

        <Pressable
          style={[
            styles.googleButton,
            googleLoading &&
              styles.disabledButton,
          ]}
          onPress={handleGoogleSignIn}
          disabled={
            loading ||
            googleLoading
          }
        >
          {googleLoading ? (
            <View style={styles.loadingRow}>

              <ActivityIndicator
                color="#000000"
              />

              <Text
                style={styles.googleButtonText}
              >
                SIGNING IN...
              </Text>

            </View>
          ) : (
            <View
              style={styles.googleContent}
            >

              <Text
                style={styles.googleIcon}
              >
                G
              </Text>

              <Text
                style={styles.googleButtonText}
              >
                Continue with Google
              </Text>

            </View>
          )}
        </Pressable>

        {/* =================================================
            REGISTER
        ================================================= */}

        <View style={styles.registerRow}>

          <Text
            style={styles.registerText}
          >
            Don't have an account?
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/auth/register"
              )
            }
            disabled={
              loading ||
              googleLoading
            }
          >
            <Text
              style={styles.registerLink}
            >
              Register
            </Text>
          </Pressable>

        </View>

      </View>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f5f7",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 25,
  },

  icon: {
    fontSize: 50,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    marginBottom: 15,
  },

  forgotText: {
    textAlign: "right",
    color: "#0066ff",
    fontWeight: "600",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  orText: {
    marginHorizontal: 12,
    color: "#888888",
    fontSize: 13,
    fontWeight: "600",
  },

  googleButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },

  googleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  googleIcon: {
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 10,
  },

  googleButtonText: {
    color: "#222222",
    fontSize: 16,
    fontWeight: "600",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 5,
  },

  registerText: {
    color: "#666666",
  },

  registerLink: {
    color: "#0066ff",
    fontWeight: "bold",
  },

});