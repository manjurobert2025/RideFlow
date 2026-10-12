
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type * as LeafletTypes from "leaflet";
import "leaflet/dist/leaflet.css";

type RiderMapProps = {
  latitude: number;
  longitude: number;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;
  pickupLocation: string;
  dropoffLocation: string;
  driverLatitude: number | null;
  driverLongitude: number | null;
  mapRef?: React.RefObject<any>;
};

function hasValidCoordinates(
  latitude: unknown,
  longitude: unknown
): latitude is number {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export default function RiderMap({
  latitude,
  longitude,
  dropoffLatitude,
  dropoffLongitude,
  pickupLocation,
  dropoffLocation,
  driverLatitude,
  driverLongitude,
  mapRef,
}: RiderMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletTypes.Map | null>(null);

  const pickupMarkerRef = useRef<LeafletTypes.Marker | null>(null);
  const dropoffMarkerRef = useRef<LeafletTypes.Marker | null>(null);
  const driverMarkerRef = useRef<LeafletTypes.Marker | null>(null);
  const routeLayerRef = useRef<LeafletTypes.Polyline | null>(null);

  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeError, setRouteError] = useState("");

  // Load Leaflet and create the map only in the browser.
  useEffect(() => {
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    async function initializeMap() {
      if (
        typeof document === "undefined" ||
        !containerRef.current ||
        mapInstanceRef.current
      ) {
        return;
      }

      try {
        // Load CSS only in the browser.
        

        const leafletModule = await import("leaflet");
        const leaflet = leafletModule.default ?? leafletModule;

        if (cancelled || !containerRef.current) {
          return;
        }

        const L = leafletModule.default ?? leafletModule;
        leafletRef.current = L;

        const initialLatitude = hasValidCoordinates(
          latitude,
          longitude
        )
          ? latitude
          : 10.8505;

        const initialLongitude = hasValidCoordinates(
          latitude,
          longitude
        )
          ? longitude
          : 76.2711;

        const map = L.map(containerRef.current).setView(
          [initialLatitude, initialLongitude],
          13
        );

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
          }
        ).addTo(map);

        mapInstanceRef.current = map;

        if (mapRef) {
          (mapRef as React.MutableRefObject<any>).current = map;
        }

        setMapReady(true);

        resizeTimer = setTimeout(() => {
          if (!cancelled && mapInstanceRef.current) {
            map.invalidateSize();
          }
        }, 150);
      } catch (error) {
        console.error("MAP INITIALIZATION ERROR:", error);
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      if (resizeTimer !== undefined) {
        clearTimeout(resizeTimer);
      }

      const map = mapInstanceRef.current;

      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }

      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      driverMarkerRef.current = null;
      routeLayerRef.current = null;
      leafletRef.current = null;

      if (mapRef) {
        (mapRef as React.MutableRefObject<any>).current = null;
      }
    };
  }, []);

  // Update pickup, drop-off, and driver markers.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (!map || !L || !mapReady) {
      return;
    }

    // Pickup marker.
    if (hasValidCoordinates(latitude, longitude)) {
      const position: LeafletTypes.LatLngExpression = [
        latitude,
        longitude,
      ];

      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng(position);
        pickupMarkerRef.current.setPopupContent(pickupLocation);
      } else {
        pickupMarkerRef.current = L.marker(position)
          .addTo(map)
          .bindPopup(pickupLocation);
      }
    }

    // Drop-off marker.
    if (
      typeof dropoffLatitude === "number" &&
      typeof dropoffLongitude === "number" &&
      Number.isFinite(dropoffLatitude) &&
      Number.isFinite(dropoffLongitude) &&
      dropoffLatitude >= -90 &&
      dropoffLatitude <= 90 &&
      dropoffLongitude >= -180 &&
      dropoffLongitude <= 180
    ) {
      const position: LeafletTypes.LatLngExpression = [
        dropoffLatitude,
        dropoffLongitude,
      ];

      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setLatLng(position);
        dropoffMarkerRef.current.setPopupContent(dropoffLocation);
      } else {
        dropoffMarkerRef.current = L.marker(position)
          .addTo(map)
          .bindPopup(dropoffLocation);
      }
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }

    // Driver marker.
    if (
      typeof driverLatitude === "number" &&
      typeof driverLongitude === "number" &&
      Number.isFinite(driverLatitude) &&
      Number.isFinite(driverLongitude) &&
      driverLatitude >= -90 &&
      driverLatitude <= 90 &&
      driverLongitude >= -180 &&
      driverLongitude <= 180
    ) {
      const position: LeafletTypes.LatLngExpression = [
        driverLatitude,
        driverLongitude,
      ];

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng(position);
      } else {
        driverMarkerRef.current = L.marker(position)
          .addTo(map)
          .bindPopup("Driver");
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
  }, [
    mapReady,
    latitude,
    longitude,
    pickupLocation,
    dropoffLatitude,
    dropoffLongitude,
    dropoffLocation,
    driverLatitude,
    driverLongitude,
  ]);

  // Fetch and draw the route.
  useEffect(() => {
    let cancelled = false;

    async function getRoute() {
      const map = mapInstanceRef.current;
      const L = leafletRef.current;

      if (!map || !L || !mapReady) {
        return;
      }

      if (
        !hasValidCoordinates(latitude, longitude) ||
        !hasValidCoordinates(dropoffLatitude, dropoffLongitude)
      ) {
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }
        return;
      }

      const points: [number, number][] = [];

      // Driver -> pickup -> drop-off, when driver coordinates are available.
      if (
        typeof driverLatitude === "number" &&
        typeof driverLongitude === "number" &&
        Number.isFinite(driverLatitude) &&
        Number.isFinite(driverLongitude) &&
        driverLatitude >= -90 &&
        driverLatitude <= 90 &&
        driverLongitude >= -180 &&
        driverLongitude <= 180
      ) {
        points.push([driverLongitude, driverLatitude]);
      }

      
points.push([longitude, latitude]);

if (
  typeof dropoffLongitude === "number" &&
  typeof dropoffLatitude === "number" &&
  Number.isFinite(dropoffLongitude) &&
  Number.isFinite(dropoffLatitude)
) {
  points.push([dropoffLongitude, dropoffLatitude]);
} else {
  console.error("Invalid drop-off coordinates", {
    dropoffLongitude,
    dropoffLatitude,
  });
  return;
}


      const routeCoordinates = points
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(";");

      const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        `${routeCoordinates}?overview=full&geometries=geojson`;

      try {
        setRouteError("");

        console.log("Route coordinates:", routeCoordinates);

        const response = await fetch(url);
        const responseText = await response.text();

        if (!response.ok) {
          console.error("OSRM response:", responseText);
          throw new Error(
            `Route request failed: ${response.status} - ${responseText}`
          );
        }

        const data = JSON.parse(responseText);

        if (
          data.code !== "Ok" ||
          !Array.isArray(data.routes) ||
          data.routes.length === 0
        ) {
          throw new Error(
            data.message || data.code || "No route found."
          );
        }

        if (cancelled) {
          return;
        }

        const route = data.routes[0];

        const routePoints: [number, number][] =
          route.geometry.coordinates.map(
            (point: [number, number]) => [point[1], point[0]]
          );

        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }

        routeLayerRef.current = L.polyline(routePoints, {
          color: "#2563EB",
          weight: 6,
          opacity: 0.85,
          lineJoin: "round",
          lineCap: "round",
        }).addTo(map);

        const bounds = routeLayerRef.current.getBounds();

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [35, 35],
            maxZoom: 15,
          });
        }

        console.log("Route distance (metres):", route.distance);
        console.log("Route duration (seconds):", route.duration);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error ? error.message : String(error);

        console.error("ROUTE ERROR:", message);
        setRouteError(message);
      }
    }

    void getRoute();

    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    latitude,
    longitude,
    dropoffLatitude,
    dropoffLongitude,
    driverLatitude,
    driverLongitude,
  ]);

  return (
    <View style={styles.container}>
      <div
        ref={containerRef}
        style={{
          height: 300,
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
        }}
      />

      {routeError ? (
        <Text style={styles.error}>
          Route unavailable: {routeError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
  },
  error: {
    color: "#B91C1C",
    fontSize: 12,
    marginTop: 6,
  },
});
