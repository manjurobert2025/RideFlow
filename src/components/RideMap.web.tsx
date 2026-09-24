import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  mapRef: React.RefObject<any>;
  defaultMapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  pickupLocation: string;
  dropLatitude: number | null;
  dropLongitude: number | null;
  dropLocation: string;
  onMapReady: () => void;
};

export default function RideMap(_: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Map is available in the mobile Rider app
      </Text>
      <Text style={styles.text}>
        Open the Rider app in Expo Go on Android/iPhone
        to see the pickup and drop markers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
