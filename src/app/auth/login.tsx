import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = async () => {
  try {
    const response = await fetch("https://localhost:7197/api/Auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

if (!response.ok) {
    alert(data.message);
    return;
}

// Save the JWT
await AsyncStorage.setItem("token", data.token);

// Go to Book Ride page
router.replace("/bookride");
  } catch (error) {
    console.error(error);
    alert("Login Failed");
  }
};
  return (
    <ScrollView
  contentContainerStyle={styles.container}
  showsVerticalScrollIndicator={false}
>
      {/* Logo */}
      <Text style={styles.logo}>🚖</Text>

      {/* Title */}
      <Text style={styles.title}>Uber Clone</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Welcome Back
      </Text>

      <Text style={styles.description}>
        Sign in to continue booking your rides.
      </Text>

      {/* Email */}
      <Text style={styles.label}>Email</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
      />

      {/* Show Password */}
      <Pressable
        onPress={() => setShowPassword(!showPassword)}
      >
        <Text style={styles.showPassword}>
          {showPassword ? "Hide Password" : "Show Password"}
        </Text>
      </Pressable>

      {/* Forgot Password */}
      <Pressable>
        <Text style={styles.forgotPassword}>
          Forgot Password?
        </Text>
      </Pressable>

      {/* Login Button */}
      <Pressable style={styles.button} onPress={login}>
  <Text style={styles.buttonText}>
    LOGIN
  </Text>
</Pressable>

      {/* Divider */}
      <Text style={styles.orText}>──────── OR ────────</Text>

      {/* Google Login */}
      <Pressable style={styles.googleButton}>
        <Text style={styles.googleText}>
          Continue with Google
        </Text>
      </Pressable>

      {/* Register */}
      <View style={styles.footer}>
        <Text>Don't have an account? </Text>

        <Link href="/auth/register" asChild>
  <Pressable>
    <Text style={styles.register}>Register</Text>
  </Pressable>
</Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  logo: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
  },

  description: {
    textAlign: "center",
    color: "gray",
    marginTop: 10,
    marginBottom: 30,
    fontSize: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },

  showPassword: {
    color: "#000",
    textAlign: "right",
    marginTop: 10,
    fontWeight: "600",
  },

  forgotPassword: {
    color: "#555",
    textAlign: "right",
    marginTop: 20,
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  orText: {
    textAlign: "center",
    marginVertical: 25,
    color: "gray",
  },

  googleButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  googleText: {
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 35,
  },

  register: {
    color: "#000",
    fontWeight: "bold",
  },
});