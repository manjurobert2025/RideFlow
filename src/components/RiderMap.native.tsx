import MapView, {
    Marker,
} from "react-native-maps";

interface RiderMapProps {
  latitude: number;
  longitude: number;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;
  pickupLocation: string;
  dropoffLocation: string;
  mapRef: any;
}

export default function RiderMap({
  latitude,
  longitude,
  dropoffLatitude,
  dropoffLongitude,
  pickupLocation,
  dropoffLocation,
  mapRef,
}: RiderMapProps) {
  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title="Pickup"
        description={
          pickupLocation ||
          "Your current location"
        }
      />

      {dropoffLatitude !== null &&
        dropoffLongitude !== null && (
          <Marker
            coordinate={{
              latitude: dropoffLatitude,
              longitude: dropoffLongitude,
            }}
            title="Destination"
            description={dropoffLocation}
          />
        )}
    </MapView>
  );
}