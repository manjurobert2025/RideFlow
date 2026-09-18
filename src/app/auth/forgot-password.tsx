import { router } from "expo-router";
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Sending Firebase password reset email to:",
        email.trim()
      );

      await resetPassword(email.trim());

      console.log(
        "Firebase password reset email sent."
      );

      alert(
        "Password reset email sent. Please check your email and follow the reset link."
      );

      router.replace("/auth/login");
    } catch (error: any) {
      console.log(
        "Forgot password error:",
        error
      );

      let message =
        "Unable to send password reset email. Please try again.";

      if (
        error?.code ===
        "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (
        error?.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account was found with this email address.";
      } else if (
        error?.code ===
        "auth/user-disabled"
      ) {
        message =
          "This account has been disabled.";
      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network error. Please check your internet connection.";
      } else if (error?.message) {
        message = error.message;
      }

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>
          🔐
        </Text>

        <Text style={styles.title}>
          Forgot Password?
        </Text>

        <Text style={styles.subtitle}>
          Enter your registered email address
          and we'll send you a password reset
          link.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={[
            styles.button,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              style={styles.buttonText}
            >
              SEND RESET EMAIL
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace("/auth/login")
          }
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
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
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

  backText: {
    marginTop: 20,
    textAlign: "center",
    color: "#0066ff",
    fontWeight: "600",
  },
});