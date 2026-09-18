import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { registerUser } from "../../../services/authService";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert("Validation", "Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email.");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Validation", "Please enter your phone number.");
      return;
    }

    if (!password) {
      Alert.alert("Validation", "Please enter a password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Validation",
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }

    try {
      console.log("Creating Rider Firebase account...");

      const user = await registerUser(
        fullName.trim(),
        email.trim(),
        phoneNumber.trim(),
        password
      );

      console.log("✅ Rider registration successful");
      console.log("Firebase UID:", user.uid);
      console.log("Email:", user.email);

      Alert.alert(
        "Registration Successful",
        "Your rider account has been created.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/auth/login");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("❌ Registration error:", error);

      let message = "Registration failed.";

      switch (error?.code) {
        case "auth/email-already-in-use":
          message = "This email is already registered.";
          break;

        case "auth/invalid-email":
          message = "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          message = "Password is too weak. Use at least 6 characters.";
          break;

        case "auth/network-request-failed":
          message = "Network error. Please check your internet connection.";
          break;

        case "permission-denied":
          message = "Firestore permission denied.";
          break;

        default:
          message =
            error?.message || "Registration failed. Please try again.";
      }

      Alert.alert("Registration Failed", message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>🚖</Text>

      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.subtitle}>
        Create your rider account
      </Text>

      <Text style={styles.label}>Full Name</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Email</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Phone Number</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      <Text style={styles.label}>Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Pressable
        style={styles.button}
        onPress={register}
      >
        <Text style={styles.buttonText}>
          CREATE ACCOUNT
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <Text>Already have an account? </Text>

        <Pressable
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.login}>Login</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 30,
  },

  logo: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "gray",
    marginBottom: 25,
    marginTop: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fafafa",
  },

  button: {
    marginTop: 25,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  login: {
    fontWeight: "bold",
    color: "#000",
  },
});