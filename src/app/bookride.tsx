import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import MapView, { Marker } from "react-native-maps";

import api from "../../services/api";

export default function BookRideScreen() {

  // ------------------------------------------------
  // TEXT VALUES
  // ------------------------------------------------

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");

  // ------------------------------------------------
  // PICKUP COORDINATES
  // ------------------------------------------------

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  // ------------------------------------------------
  // DESTINATION COORDINATES
  // ------------------------------------------------

  const [dropoffLatitude, setDropoffLatitude] =
    useState<number | null>(null);

  const [dropoffLongitude, setDropoffLongitude] =
    useState<number | null>(null);

  // ------------------------------------------------
  // LOADING STATES
  // ------------------------------------------------

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [destinationLoading, setDestinationLoading] =
    useState(false);

  const [booking, setBooking] =
    useState(false);

  // ------------------------------------------------
  // MAP REFERENCE
  // ------------------------------------------------

  const mapRef = useRef<MapView>(null);

  // ------------------------------------------------
  // RUN WHEN SCREEN OPENS
  // ------------------------------------------------

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // ------------------------------------------------
  // GET PHONE CURRENT LOCATION
  // ------------------------------------------------

  const getCurrentLocation = async () => {

    try {

      setLocationLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {

        Alert.alert(
          "Permission Required",
          "Please allow location access to book a ride."
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const currentLatitude =
        location.coords.latitude;

      const currentLongitude =
        location.coords.longitude;

      setLatitude(currentLatitude);
      setLongitude(currentLongitude);

      console.log(
        "Current GPS:",
        currentLatitude,
        currentLongitude
      );

      // ------------------------------------------------
      // CONVERT GPS TO PICKUP ADDRESS
      // ------------------------------------------------

      try {

        const addressResult =
          await Location.reverseGeocodeAsync({
            latitude: currentLatitude,
            longitude: currentLongitude,
          });

        if (addressResult.length > 0) {

          const address = addressResult[0];

          const pickupAddress = [
            address.name,
            address.street,
            address.district,
            address.city,
            address.region,
          ]
            .filter(Boolean)
            .join(", ");

          setPickupLocation(pickupAddress);
        }

      } catch (error) {

        console.log(
          "Reverse geocoding error:",
          error
        );

        // Map can still work even if address lookup fails
        setPickupLocation("Current Location");
      }

    } catch (error) {

      console.error(
        "Location error:",
        error
      );

      Alert.alert(
        "Location Error",
        "Unable to get your current location."
      );

    } finally {

      setLocationLoading(false);

    }
  };

  // ------------------------------------------------
  // FIND DESTINATION FROM TEXT
  // ------------------------------------------------

  const findDestination = async () => {

    if (!dropoffLocation.trim()) {

      Alert.alert(
        "Destination Required",
        "Please enter your destination."
      );

      return;
    }

    try {

      setDestinationLoading(true);

      // Convert typed address/place into coordinates
      const results =
        await Location.geocodeAsync(
          dropoffLocation.trim()
        );

      if (results.length === 0) {

        Alert.alert(
          "Location Not Found",
          "We could not find that destination."
        );

        return;
      }

      const destination = results[0];

      const destinationLatitude =
        destination.latitude;

      const destinationLongitude =
        destination.longitude;

      setDropoffLatitude(
        destinationLatitude
      );

      setDropoffLongitude(
        destinationLongitude
      );

      console.log(
        "Destination:",
        destinationLatitude,
        destinationLongitude
      );

      // ------------------------------------------------
      // SHOW BOTH LOCATIONS ON MAP
      // ------------------------------------------------

      if (
        latitude !== null &&
        longitude !== null
      ) {

        mapRef.current?.fitToCoordinates(
          [
            {
              latitude: latitude,
              longitude: longitude,
            },
            {
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            },
          ],
          {
            edgePadding: {
              top: 80,
              right: 80,
              bottom: 80,
              left: 80,
            },

            animated: true,
          }
        );
      }

    } catch (error) {

      console.error(
        "Destination search error:",
        error
      );

      Alert.alert(
        "Search Error",
        "Unable to find this destination."
      );

    } finally {

      setDestinationLoading(false);

    }
  };

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  const logout = async () => {

    await AsyncStorage.removeItem("token");

    router.replace("/auth/login");
  };

  // ------------------------------------------------
  // BOOK RIDE
  // ------------------------------------------------

  const bookRide = async () => {

    if (!pickupLocation.trim()) {

      Alert.alert(
        "Pickup Required",
        "Pickup location is required."
      );

      return;
    }

    if (!dropoffLocation.trim()) {

      Alert.alert(
        "Destination Required",
        "Please enter a destination."
      );

      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {

      Alert.alert(
        "Location Required",
        "Your current GPS location is unavailable."
      );

      return;
    }

    if (
      dropoffLatitude === null ||
      dropoffLongitude === null
    ) {

      Alert.alert(
        "Find Destination",
        "Please press FIND LOCATION before booking."
      );

      return;
    }

    try {

      setBooking(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {

        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        router.replace("/auth/login");

        return;
      }

      // ------------------------------------------------
      // SEND RIDE TO .NET API
      // ------------------------------------------------

      const response =
        await api.post(
          "/Ride/book",

          {
            pickupLocation:
              pickupLocation.trim(),

            dropoffLocation:
              dropoffLocation.trim(),

            pickupLatitude:
              latitude,

            pickupLongitude:
              longitude,

            // We are preparing these for backend support
            dropoffLatitude:
              dropoffLatitude,

            dropoffLongitude:
              dropoffLongitude,
          },

          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      console.log(
        "Ride booking response:",
        response.data
      );

      Alert.alert(
        "Ride Booked",
        typeof response.data === "string"
          ? response.data
          : "Your ride has been booked successfully."
      );

    } catch (error: any) {

      console.error(
        "Booking error:",
        error?.response?.data || error
      );

      if (error?.response) {

        const message =
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message ||
              "Booking failed.";

        Alert.alert(
          "Booking Failed",
          message
        );

      } else if (error?.request) {

        Alert.alert(
          "Network Error",
          "Unable to connect to the API."
        );

      } else {

        Alert.alert(
          "Error",
          "Something went wrong."
        );
      }

    } finally {

      setBooking(false);

    }
  };

  // ------------------------------------------------
  // UI
  // ------------------------------------------------

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        🚖 Book Your Ride
      </Text>

      {/* MAP */}

      <View style={styles.mapContainer}>

        {locationLoading ? (

          <View style={styles.loadingContainer}>

            <ActivityIndicator
              size="large"
            />

            <Text style={styles.loadingText}>
              Finding your location...
            </Text>

          </View>

        ) : (
          
          latitude !== null &&
          longitude !== null && (

            <MapView

              ref={mapRef}

              style={styles.map}

              initialRegion={{
                latitude: latitude,
                longitude: longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}

              showsUserLocation={true}

              showsMyLocationButton={true}
            >

              {/* PICKUP MARKER */}

              <Marker

                coordinate={{
                  latitude: latitude,
                  longitude: longitude,
                }}

                title="Pickup"

                description={
                  pickupLocation ||
                  "Your current location"
                }

              />

              {/* DESTINATION MARKER */}

              {dropoffLatitude !== null &&
                dropoffLongitude !== null && (

                  <Marker

                    coordinate={{
                      latitude:
                        dropoffLatitude,

                      longitude:
                        dropoffLongitude,
                    }}

                    title="Destination"

                    description={
                      dropoffLocation
                    }

                  />

                )}

            </MapView>

          )
        )}

      </View>

      {/* PICKUP */}

      <Text style={styles.label}>
        Pickup Location
      </Text>

      <TextInput

        style={styles.input}

        placeholder="Current location"

        value={pickupLocation}

        onChangeText={
          setPickupLocation
        }

      />

      {/* DESTINATION */}

      <Text style={styles.label}>
        Destination
      </Text>

      <TextInput

        style={styles.input}

        placeholder="Example: Lulu Mall"

        value={dropoffLocation}

        onChangeText={(text) => {

          setDropoffLocation(text);

          // Remove old destination marker
          // when user changes destination

          setDropoffLatitude(null);
          setDropoffLongitude(null);
        }}

      />

      {/* FIND LOCATION */}

      <Pressable

        style={styles.findButton}

        onPress={findDestination}

        disabled={destinationLoading}
      >

        {destinationLoading ? (

          <ActivityIndicator />

        ) : (

          <Text style={styles.findButtonText}>
            FIND LOCATION
          </Text>

        )}

      </Pressable>

      {/* BOOK RIDE */}

      <Pressable

        style={[
          styles.bookButton,
          booking &&
            styles.disabledButton,
        ]}

        onPress={bookRide}

        disabled={booking}
      >

        {booking ? (

          <ActivityIndicator />

        ) : (

          <Text style={styles.bookButtonText}>
            BOOK RIDE
          </Text>

        )}

      </Pressable>

      {/* LOGOUT */}

      <Pressable
        style={styles.logoutButton}
        onPress={logout}
      >

        <Text style={styles.logoutText}>
          ← Logout
        </Text>

      </Pressable>

    </View>
  );
}

// ------------------------------------------------
// STYLES
// ------------------------------------------------

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 45,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  mapContainer: {
    height: 240,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#f3f3f3",
    marginBottom: 10,
  },

  map: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },

  findButton: {
    marginTop: 12,
    backgroundColor: "#e8e8e8",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
  },

  findButtonText: {
    fontWeight: "bold",
    fontSize: 15,
  },

  bookButton: {
    marginTop: 15,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  bookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  disabledButton: {
    opacity: 0.6,
  },

  logoutButton: {
    alignSelf: "center",
    padding: 15,
  },

  logoutText: {
    color: "#0066ff",
    fontSize: 16,
    fontWeight: "600",
  },

});