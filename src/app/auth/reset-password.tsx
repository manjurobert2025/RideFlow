import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { resetPassword } from "../../../services/authService";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();

  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : ""
  );

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    console.log("RIDER RESET PASSWORD BUTTON PRESSED");

    // Email validation
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    // Token validation
    if (!token.trim()) {
      alert("Please enter the reset token.");
      return;
    }

    // Password validation
    if (!newPassword.trim()) {
      alert("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    // Confirm password
    if (!confirmPassword.trim()) {
      alert("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      console.log("Calling Rider reset password API...");

      const response = await resetPassword(
        email.trim(),
        token.trim(),
        newPassword
      );

      console.log("Rider reset password response:", response);

      alert("Password reset successfully!");

      // Return Rider to login
      router.replace("/auth/login");
    } catch (error: any) {
      console.log("Rider reset password error:", error);

      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Data:", error.response.data);
      }

      alert(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Unable to reset your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        {/* Icon */}
        <Text style={styles.icon}>🔑</Text>

        {/* Title */}
        <Text style={styles.title}>
          Reset Password
        </Text>

        {/* Description */}
        <Text style={styles.subtitle}>
          Enter the reset token sent to your email and choose a new password.
        </Text>

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Reset Token */}
        <TextInput
          style={styles.input}
          placeholder="Reset Token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* New Password */}
        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        {/* Confirm Password */}
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Reset Button */}
        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              RESET PASSWORD
            </Text>
          )}
        </Pressable>

        {/* Back to Login */}
        <Pressable
          onPress={() => router.replace("/auth/login")}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f5f7",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 30,
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
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 25,
  },

  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 15,
    backgroundColor: "#ffffff",
  },

  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#000000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },

  backText: {
    color: "#0066ff",
    marginTop: 22,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});