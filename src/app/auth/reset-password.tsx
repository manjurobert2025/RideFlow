import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔐</Text>

        <Text style={styles.title}>
          Reset Password
        </Text>

        <Text style={styles.message}>
          A password reset link has been sent to
          your email address.
        </Text>

        <Text style={styles.instruction}>
          Please open the email and follow the
          link to create your new password.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            router.replace("/auth/login")
          }
        >
          <Text style={styles.buttonText}>
            GO TO LOGIN
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
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },

  instruction: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    color: "#6B7280",
    marginBottom: 25,
  },

  button: {
    backgroundColor: "#000000",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});