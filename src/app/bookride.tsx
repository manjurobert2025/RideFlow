import AsyncStorage from "@react-native-async-storage/async-storage";
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

  const bookRide = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    const response = await fetch("https://localhost:7197/api/Ride/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
  pickupLocation: pickupLocation,
  dropoffLocation: dropoffLocation,
  pickupLatitude: 8.5241,
  pickupLongitude: 76.9366,
}),
    });

    const result = await response.text();
    alert(result);
  } catch (error) {
    console.error(error);
    alert("Booking failed");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Your Ride</Text>

      <Text style={styles.label}>Pickup Location</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter pickup location"
        value={pickupLocation}
        onChangeText={setPickupLocation}
      />

      <Text style={styles.label}>Dropoff Location</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter dropoff location"
        value={dropoffLocation}
        onChangeText={setDropoffLocation}
      />

      <Pressable style={styles.button} onPress={bookRide}>
        <Text style={styles.buttonText}>BOOK RIDE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },

  label: {
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
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