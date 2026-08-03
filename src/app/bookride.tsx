import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
export default function BookRideScreen() {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
const logout = async () => {
  await AsyncStorage.removeItem("token");
  router.replace("/auth/login");
};
  const bookRide = async () => {
    if (!pickupLocation.trim()) {
      alert("Please enter pickup location.");
      return;
    }

    if (!dropoffLocation.trim()) {
      alert("Please enter dropoff location.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        "http://192.168.1.5:5150/api/Ride/book",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickupLocation: pickupLocation.trim(),
            dropoffLocation: dropoffLocation.trim(),

            // Temporary coordinates until map integration
            pickupLatitude: 8.5241,
            pickupLongitude: 76.9366,
          }),
        }
      );

      const result = await response.text();

      if (!response.ok) {
        console.log("Booking error:", result);
        alert(result || "Booking failed");
        return;
      }

      console.log("Ride booking response:", result);

      alert(result);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚖</Text>

      <Text style={styles.title}>
        Book Your Ride
      </Text>

      <Text style={styles.subtitle}>
        Enter your pickup and destination locations.
      </Text>

      <Text style={styles.label}>
        Pickup Location
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter pickup location"
        value={pickupLocation}
        onChangeText={setPickupLocation}
      />

      <Text style={styles.label}>
        Dropoff Location
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter dropoff location"
        value={dropoffLocation}
        onChangeText={setDropoffLocation}
      />
<Pressable
  style={styles.backButton}
  onPress={logout}
>
  <Text style={styles.backButtonText}>
    ← Logout
  </Text>
</Pressable>
      <Pressable
        style={styles.button}
        onPress={bookRide}
      >
        <Text style={styles.buttonText}>
          BOOK RIDE
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
backButton: {
  alignSelf: "flex-start",
  marginBottom: 25,
  paddingVertical: 8,
},

backButtonText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#0066ff",
},
  icon: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },

  button: {
    marginTop: 30,
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
});