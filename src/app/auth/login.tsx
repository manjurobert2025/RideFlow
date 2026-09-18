import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { loginUser } from "../../../services/authService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Validation",
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Validation",
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Logging in rider:",
        email.trim()
      );

      const user = await loginUser(
        email.trim(),
        password
      );

      console.log(
        "✅ Firebase login successful:",
        user.uid
      );

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
      await AsyncStorage.removeItem(
        "token"
      );

      router.replace("/bookride");
    } catch (error: any) {
      console.error(
        "Login error:",
        error
      );

      let message =
        "Unable to login. Please try again.";

      switch (error?.code) {
        case "auth/invalid-email":
          message =
            "Please enter a valid email address.";
          break;

        case "auth/invalid-credential":
          message =
            "Invalid email or password.";
          break;

        case "auth/user-not-found":
          message =
            "No account found with this email address.";
          break;

        case "auth/wrong-password":
          message =
            "Incorrect password.";
          break;

        case "auth/user-disabled":
          message =
            "This account has been disabled.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Please check your internet connection.";
          break;
      }

      Alert.alert(
        "Login Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>
          🚖
        </Text>

        <Text style={styles.title}>
          Rider Login
        </Text>

        <Text style={styles.subtitle}>
          Login to book your ride
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

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Pressable
          onPress={() =>
            router.push(
              "/auth/forgot-password"
            )
          }
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.buttonText}
            >
              LOGIN
            </Text>
          )}
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don't have an account?
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/auth/register"
              )
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

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
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