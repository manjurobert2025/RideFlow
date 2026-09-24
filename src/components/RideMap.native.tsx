import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

type Props = {
  mapRef: React.RefObject<MapView | null>;
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

export default function RideMap({
  mapRef,
  defaultMapRegion,
  pickupLatitude,
  pickupLongitude,
  pickupLocation,
  dropLatitude,
  dropLongitude,
  dropLocation,
  onMapReady,
}: Props) {
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onMapReady={onMapReady}
      >
        {pickupLatitude !== null &&
          pickupLongitude !== null && (
            <Marker
              coordinate={{
                latitude: pickupLatitude,
                longitude: pickupLongitude,
              }}
              title="Pickup Location"
              description={pickupLocation || "Pickup point"}
              pinColor="green"
            />
          )}

        {dropLatitude !== null &&
          dropLongitude !== null && (
            <Marker
              coordinate={{
                latitude: dropLatitude,
                longitude: dropLongitude,
              }}
              title="Drop Location"
              description={dropLocation || "Destination"}
              pinColor="red"
            />
          )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    flex: 1,
  },
});
