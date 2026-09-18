import { useEffect, useRef, useState } from "react";

interface RiderMapProps {
  latitude: number;
  longitude: number;

  dropoffLatitude: number | null;
  dropoffLongitude: number | null;

  pickupLocation: string;
  dropoffLocation: string;

  driverLatitude: number | null;
  driverLongitude: number | null;

  mapRef: any;
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
  // ============================================================
  // REFS
  // ============================================================

  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapInstanceRef =
    useRef<any>(null);

  const driverMarkerRef =
    useRef<any>(null);

  const pickupMarkerRef =
    useRef<any>(null);

  const dropoffMarkerRef =
    useRef<any>(null);

  const routeLayerRef =
    useRef<any>(null);

  const lastRouteDriverLocationRef =
    useRef<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [mapReady, setMapReady] =
    useState(false);

  // ============================================================
  // INITIALIZE MAP
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      try {
        // --------------------------------------------------------
        // Only initialize Leaflet in browser
        // --------------------------------------------------------

        if (
          typeof window === "undefined" ||
          typeof document === "undefined"
        ) {
          return;
        }

        // --------------------------------------------------------
        // Dynamically import Leaflet
        // This prevents "window is not defined" with Expo Web
        // --------------------------------------------------------

        const leafletModule =
          await import("leaflet");

        if (cancelled) {
          return;
        }

        const L =
          (leafletModule as any).default ||
          leafletModule;

        // --------------------------------------------------------
        // Add Leaflet CSS dynamically
        // --------------------------------------------------------

        if (
          !document.getElementById(
            "leaflet-css"
          )
        ) {
          const link =
            document.createElement("link");

          link.id = "leaflet-css";
          link.rel = "stylesheet";

          link.href =
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

          document.head.appendChild(link);
        }

        // --------------------------------------------------------
        // Make sure container exists
        // --------------------------------------------------------

        if (
          !mapContainerRef.current ||
          mapInstanceRef.current
        ) {
          return;
        }

        // --------------------------------------------------------
        // Create Leaflet map
        // --------------------------------------------------------

        const map = L.map(
          mapContainerRef.current
        ).setView(
          [latitude, longitude],
          14
        );

        mapInstanceRef.current = map;

        // --------------------------------------------------------
        // OpenStreetMap tiles
        // --------------------------------------------------------

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              "&copy; OpenStreetMap contributors",
            maxZoom: 19,
          }
        ).addTo(map);

        // ========================================================
        // PICKUP ICON
        // ========================================================

        const pickupIcon = L.divIcon({
          className:
            "custom-pickup-marker",

          html: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #2563EB;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 19px;
            ">
              📍
            </div>
          `,

          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        // ========================================================
        // DROPOFF ICON
        // ========================================================

        const dropoffIcon = L.divIcon({
          className:
            "custom-dropoff-marker",

          html: `
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #DC2626;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 19px;
            ">
              🏁
            </div>
          `,

          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        // ========================================================
        // DRIVER ICON
        // ========================================================

        const driverIcon = L.divIcon({
          className:
            "custom-driver-marker",

          html: `
            <div style="
              width: 46px;
              height: 46px;
              border-radius: 50%;
              background: #16A34A;
              border: 4px solid white;
              box-shadow: 0 3px 10px rgba(0,0,0,0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 25px;
            ">
              🚗
            </div>
          `,

          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });

        // ========================================================
        // PICKUP MARKER
        // ========================================================

        pickupMarkerRef.current =
          L.marker(
            [latitude, longitude],
            {
              icon: pickupIcon,
            }
          )
            .addTo(map)
            .bindPopup(
              `<strong>Pickup</strong><br/>${
                pickupLocation ||
                "Pickup location"
              }`
            );

        // ========================================================
        // DROPOFF MARKER
        // ========================================================

        if (
          dropoffLatitude !== null &&
          dropoffLongitude !== null
        ) {
          dropoffMarkerRef.current =
            L.marker(
              [
                dropoffLatitude,
                dropoffLongitude,
              ],
              {
                icon: dropoffIcon,
              }
            )
              .addTo(map)
              .bindPopup(
                `<strong>Destination</strong><br/>${
                  dropoffLocation ||
                  "Destination"
                }`
              );
        }

        // ========================================================
        // DRIVER MARKER
        // ========================================================

        if (
          driverLatitude !== null &&
          driverLongitude !== null
        ) {
          driverMarkerRef.current =
            L.marker(
              [
                driverLatitude,
                driverLongitude,
              ],
              {
                icon: driverIcon,
              }
            )
              .addTo(map)
              .bindPopup(
                "<strong>Driver</strong><br/>Driver location is live"
              );
        }

        // ========================================================
        // MAP READY
        // ========================================================

        setMapReady(true);

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);

        // --------------------------------------------------------
        // Expose map through mapRef if supplied
        // --------------------------------------------------------

        if (mapRef) {
          if (
            typeof mapRef === "object" &&
            "current" in mapRef
          ) {
            mapRef.current = map;
          }
        }
      } catch (error) {
        console.error(
          "MAP INITIALIZATION ERROR:",
          error
        );
      }
    };

    initializeMap();

    // ============================================================
    // CLEANUP
    // ============================================================

    return () => {
      cancelled = true;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      driverMarkerRef.current = null;
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      routeLayerRef.current = null;

      setMapReady(false);
    };

    // Map initializes once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // UPDATE DRIVER MARKER
  // ============================================================

  useEffect(() => {
    if (
      !mapReady ||
      !mapInstanceRef.current ||
      driverLatitude === null ||
      driverLongitude === null
    ) {
      return;
    }

    let cancelled = false;

    const updateDriverMarker = async () => {
      try {
        const leafletModule =
          await import("leaflet");

        if (cancelled) {
          return;
        }

        const L =
          (leafletModule as any).default ||
          leafletModule;

        // --------------------------------------------------------
        // Move existing driver marker
        // --------------------------------------------------------

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([
            driverLatitude,
            driverLongitude,
          ]);
        } else {
          // ------------------------------------------------------
          // Create driver marker if it doesn't exist
          // ------------------------------------------------------

          const driverIcon = L.divIcon({
            className:
              "custom-driver-marker",

            html: `
              <div style="
                width: 46px;
                height: 46px;
                border-radius: 50%;
                background: #16A34A;
                border: 4px solid white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 25px;
              ">
                🚗
              </div>
            `,

            iconSize: [46, 46],
            iconAnchor: [23, 23],
          });

          driverMarkerRef.current =
            L.marker(
              [
                driverLatitude,
                driverLongitude,
              ],
              {
                icon: driverIcon,
              }
            )
              .addTo(
                mapInstanceRef.current
              )
              .bindPopup(
                "<strong>Driver</strong><br/>Driver location is live"
              );
        }
      } catch (error) {
        console.error(
          "DRIVER MARKER ERROR:",
          error
        );
      }
    };

    updateDriverMarker();

    return () => {
      cancelled = true;
    };
  }, [
    driverLatitude,
    driverLongitude,
    mapReady,
  ]);

  // ============================================================
  // GET ROAD ROUTE
  // ============================================================

  useEffect(() => {
    if (
      !mapReady ||
      !mapInstanceRef.current ||
      driverLatitude === null ||
      driverLongitude === null
    ) {
      return;
    }

    if (
      dropoffLatitude === null ||
      dropoffLongitude === null
    ) {
      return;
    }

    // ----------------------------------------------------------
    // Check whether driver moved enough to request a new route
    // ----------------------------------------------------------

    const previous =
      lastRouteDriverLocationRef.current;

    if (previous) {
      const latDifference =
        Math.abs(
          driverLatitude -
            previous.latitude
        );

      const lngDifference =
        Math.abs(
          driverLongitude -
            previous.longitude
        );

      // Approximately 50 metres
      const movedEnough =
        latDifference > 0.0005 ||
        lngDifference > 0.0005;

      if (!movedEnough) {
        return;
      }
    }

    // ----------------------------------------------------------
    // Save current driver position
    // ----------------------------------------------------------

    lastRouteDriverLocationRef.current = {
      latitude: driverLatitude,
      longitude: driverLongitude,
    };

    let cancelled = false;

    const getRoute = async () => {
      try {
        // ======================================================
        // OSRM ROUTE COORDINATES
        //
        // OSRM expects:
        //
        // longitude,latitude
        //
        // Route:
        //
        // Driver → Pickup → Destination
        // ======================================================

        const routeCoordinates = [
          `${driverLongitude},${driverLatitude}`,
          `${longitude},${latitude}`,
          `${dropoffLongitude},${dropoffLatitude}`,
        ].join(";");

        // ======================================================
        // OSRM URL
        // ======================================================

        const url =
          `https://router.project-osrm.org/route/v1/driving/${routeCoordinates}` +
          `?overview=full&geometries=geojson`;

        console.log(
          "Requesting route:",
          url
        );

        // ======================================================
        // REQUEST ROUTE
        // ======================================================

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Route request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        // ======================================================
        // CHECK ROUTE RESPONSE
        // ======================================================

        if (
          data.code !== "Ok" ||
          !data.routes ||
          data.routes.length === 0
        ) {
          console.log(
            "No route found:",
            data
          );

          return;
        }

        // ======================================================
        // GET FIRST ROUTE
        // ======================================================

        const route =
          data.routes[0];

        // ======================================================
        // GET GEOJSON COORDINATES
        //
        // GeoJSON:
        // [longitude, latitude]
        // ======================================================

        const coordinates =
          route.geometry.coordinates;

        // ======================================================
        // CONVERT TO LEAFLET FORMAT
        //
        // Leaflet:
        // [latitude, longitude]
        // ======================================================

        const routePoints =
          coordinates.map(
            (
              point: [number, number]
            ) => [
              point[1],
              point[0],
            ]
          );

        // ======================================================
        // LOAD LEAFLET
        // ======================================================

        const leafletModule =
          await import("leaflet");

        if (cancelled) {
          return;
        }

        const L =
          (leafletModule as any).default ||
          leafletModule;

        // ======================================================
        // REMOVE PREVIOUS ROUTE
        // ======================================================

        if (routeLayerRef.current) {
          routeLayerRef.current.remove();

          routeLayerRef.current = null;
        }

        // ======================================================
        // DRAW NEW ROUTE
        // ======================================================

        routeLayerRef.current =
          L.polyline(
            routePoints,
            {
              color: "#2563EB",
              weight: 6,
              opacity: 0.8,
              lineJoin: "round",
              lineCap: "round",
            }
          ).addTo(
            mapInstanceRef.current
          );

        // ======================================================
        // LOG DISTANCE
        // ======================================================

        console.log(
          "Route distance:",
          (
            route.distance / 1000
          ).toFixed(2),
          "km"
        );

        // ======================================================
        // LOG DURATION
        // ======================================================

        console.log(
          "Route duration:",
          Math.round(
            route.duration / 60
          ),
          "minutes"
        );

        // ======================================================
        // FIT MAP AROUND ROUTE
        // ======================================================

        const bounds =
          routeLayerRef.current.getBounds();

        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(
            bounds,
            {
              padding: [40, 40],
              maxZoom: 15,
            }
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "ROUTE ERROR:",
            error
          );
        }
      }
    };

    getRoute();

    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    driverLatitude,
    driverLongitude,
    latitude,
    longitude,
    dropoffLatitude,
    dropoffLongitude,
  ]);

  // ============================================================
  // MAP CONTAINER
  // ============================================================

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "350px",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#E5E7EB",
      }}
    />
  );
}