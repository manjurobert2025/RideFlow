
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

type RideData = {
  id: string;
  status?: string;
  paymentStatus?: string;
  fare?: number;
  amount?: number;
  createdAt?: {
    toMillis?: () => number;
  } | null;
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Find the rider's latest ride after login.
  const findRideAfterLogin = async (
    riderId: string
  ): Promise<RideData | null> => {
    try {
      const ridesQuery = query(
        collection(db, "rides"),
        where("riderId", "==", riderId)
      );

      const snapshot = await getDocs(ridesQuery);

      if (snapshot.empty) {
        return null;
      }

      const rides: RideData[] = snapshot.docs
        .map((rideDoc): RideData => ({
          ...rideDoc.data(),
          id: rideDoc.id,
        }))
        .filter(
          (ride) =>
            ride.status === "requested" ||
            ride.status === "accepted" ||
            ride.status === "driverArrived" ||
            ride.status === "inProgress" ||
            ride.status === "completed"
        );

      rides.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });

      // An unfinished ride takes priority.
      const activeRide = rides.find(
        (ride) =>
          ride.status === "requested" ||
          ride.status === "accepted" ||
          ride.status === "driverArrived" ||
          ride.status === "inProgress"
      );

      if (activeRide) {
        return activeRide;
      }

      // Otherwise, resume payment for a completed unpaid ride.
      const pendingPaymentRide = rides.find(
        (ride) =>
          ride.status === "completed" &&
          ride.paymentStatus !== "paid"
      );

      if (pendingPaymentRide) {
        return pendingPaymentRide;
      }

      return null;
    } catch (error) {
      console.log("FIND RIDE AFTER LOGIN ERROR:", error);
      return null;
    }
  };

  const navigateAfterLogin = async (userId: string) => {
    console.log("LOGIN DEBUG: Checking for an existing ride");

    const ride = await findRideAfterLogin(userId);

    if (!ride) {
      console.log("LOGIN DEBUG: No active ride; opening bookride");
      router.replace("/bookride");
      return;
    }

    console.log("LOGIN DEBUG: Ride found", ride.id);
    console.log("LOGIN DEBUG: Ride status", ride.status);
    console.log(
      "LOGIN DEBUG: Payment status",
      ride.paymentStatus || "pending"
    );

    if (
      ride.status === "completed" &&
      ride.paymentStatus !== "paid"
    ) {
      router.replace({
        pathname: "/payment",
        params: {
          rideId: ride.id,
          amount: String(ride.fare ?? ride.amount ?? 250),
        },
      });
      return;
    }

    if (ride.status === "requested") {
      router.replace({
        pathname: "/bookride",
        params: { resumeRideId: ride.id },
      });
      return;
    }

    if (
      ride.status === "accepted" ||
      ride.status === "driverArrived" ||
      ride.status === "inProgress"
    ) {
      router.replace({
        pathname: "/rideprogress",
        params: { rideId: ride.id },
      });
      return;
    }

    router.replace("/bookride");
  };

  // Email/password login.
  const handleLogin = async () => {
    const emailAddress = email.trim();

    if (!emailAddress) {
      Alert.alert("Validation", "Please enter your email address.");
      return;
    }

    if (!password) {
      Alert.alert("Validation", "Please enter your password.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailAddress)) {
      Alert.alert("Validation", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      console.log("LOGIN DEBUG 1: Starting Firebase login");

      const user = await loginUser(emailAddress, password);

      console.log("LOGIN DEBUG 2: Firebase login succeeded");
      console.log("LOGIN DEBUG UID:", user.uid);

      await AsyncStorage.setItem("firebaseUid", user.uid);

      if (user.email) {
        await AsyncStorage.setItem("email", user.email);
      }

      await AsyncStorage.removeItem("token");

      console.log("LOGIN DEBUG 4: Starting post-login navigation");
      await navigateAfterLogin(user.uid);
      console.log("LOGIN DEBUG 5: Navigation finished");
    } catch (error: any) {
      console.log("LOGIN DEBUG ERROR:", error);
      console.log("LOGIN DEBUG ERROR CODE:", error?.code);
      console.log("LOGIN DEBUG ERROR MESSAGE:", error?.message);

      let message = error?.message ?? "Please try again.";

      switch (error?.code) {
        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          message = "Invalid email or password.";
          break;

        case "auth/user-disabled":
          message = "This account has been disabled.";
          break;

        case "auth/too-many-requests":
          message = "Too many login attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          message =
            "Firebase network request failed. Check your internet connection.";
          break;
      }

      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in is currently configured for Web.
  const handleGoogleSignIn = async () => {
    console.log("GOOGLE SIGN-IN BUTTON PRESSED; PLATFORM:", Platform.OS);

    if (Platform.OS !== "web") {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is currently configured for the Web version. Android Google Sign-In must be configured separately."
      );
      return;
    }

    try {
      setGoogleLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("GOOGLE SIGN-IN SUCCESS:", user.uid);

      const riderRef = doc(db, "riders", user.uid);

      await setDoc(
        riderRef,
        {
          userId: user.uid,
          fullName: user.displayName || "Rider",
          email: user.email || "",
          phoneNumber: "",
          role: "Rider",
          photoURL: user.photoURL || "",
          authProvider: "google",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await AsyncStorage.setItem("firebaseUid", user.uid);

      if (user.email) {
        await AsyncStorage.setItem("email", user.email);
      }

      if (user.displayName) {
        await AsyncStorage.setItem("fullName", user.displayName);
      }

      await AsyncStorage.removeItem("token");
      await navigateAfterLogin(user.uid);
    } catch (error: any) {
      console.log("GOOGLE SIGN-IN ERROR:", error);
      console.log("GOOGLE SIGN-IN ERROR CODE:", error?.code);

      let message = "Unable to sign in with Google.";

      switch (error?.code) {
        case "auth/popup-closed-by-user":
          message = "Google Sign-In was cancelled.";
          break;

        case "auth/popup-timeout":
          message = "Google Sign-In timed out. Please try again.";
          break;

        case "auth/popup-blocked":
          message =
            "The Google Sign-In popup was blocked. Allow popups and try again.";
          break;

        case "auth/cancelled-popup-request":
          message = "A Google Sign-In request is already in progress.";
          break;

        case "auth/account-exists-with-different-credential":
          message =
            "An account already exists with this email using a different sign-in method.";
          break;

        case "auth/operation-not-allowed":
          message =
            "Google Sign-In is not enabled in Firebase Authentication.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        default:
          message = error?.message ?? message;
          break;
      }

      Alert.alert("Google Sign-In", message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🚖</Text>
        <Text style={styles.title}>Rider Login</Text>
        <Text style={styles.subtitle}>Login to book your ride</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading && !googleLoading}
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          editable={!loading && !googleLoading}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Pressable
          onPress={() => setShowPassword((previous) => !previous)}
          disabled={loading || googleLoading}
          style={styles.showPassword}
        >
          <Text style={styles.showPasswordText}>
            {showPassword ? "Hide password" : "Show password"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/auth/forgot-password")}
          disabled={loading || googleLoading}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>

        <Pressable
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading || googleLoading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.buttonText}>LOGGING IN...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </Pressable>

        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <Pressable
          style={[
            styles.googleButton,
            googleLoading && styles.disabledButton,
          ]}
          onPress={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#000000" />
              <Text style={styles.googleButtonText}>SIGNING IN...</Text>
            </View>
          ) : (
            <View style={styles.googleContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don't have an account?
          </Text>
          <Pressable
            onPress={() => router.push("/auth/register")}
            disabled={loading || googleLoading}
          >
            <Text style={styles.registerLink}>Register</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

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
    color: "#111827",
  },
  showPassword: {
    alignSelf: "flex-end",
    marginTop: -7,
    marginBottom: 12,
    paddingVertical: 4,
  },
  showPasswordText: {
    color: "#0066ff",
    fontWeight: "600",
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
    justifyContent: "center",
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
    color: "#4285F4",
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
