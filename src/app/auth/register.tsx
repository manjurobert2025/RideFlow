import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const register = async () => {
if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }
  try {
    const response = await fetch("http://192.168.1.5:5150/api/Auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
   body: JSON.stringify({
    name: fullName,
    email: email,
    phoneNumber: phoneNumber,
    password: password,
    role: "Rider",
  }),
});
console.log("Status:", response.status);

  const text = await response.text();
  console.log("Response:", text);

  if (response.ok) {
    alert("Registration successful");
  } else {
    alert(text);
  }
} catch (error) {
  console.error(error);
  alert("Fetch failed. Check the browser console (F12).");
}
  };

  return (
    <View style={styles.container}>
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

      <Pressable style={styles.button} onPress={register}>
        <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
      </Pressable>

      <View style={styles.footer}>
        <Text>Already have an account? </Text>

        <Pressable>
          <Text style={styles.login}>Login</Text>
        </Pressable>
      </View>
    </View>
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