import * as Location from "expo-location";

import { router, useLocalSearchParams } from "expo-router";



import {
  addDoc,

  collection,

  doc,

  getDoc,

  getDocs,

  onSnapshot,

  query,

  serverTimestamp,

  updateDoc,

  where,
} from "firebase/firestore";



import { useEffect, useRef, useState } from "react";



import {
  ActivityIndicator,

  Alert,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from "react-native";



import { auth, db } from "../../services/firebase";

import RideMap from "../components/RideMap";



// ============================================================

// VEHICLE TYPE

// ============================================================



interface VehicleType {

  id: string;

  name: string;

  code: string;

  icon: string;

  isActive: boolean;

  baseFare: number;

  perKmRate: number;

  perMinuteRate: number;

}



// ============================================================

// BOOK RIDE SCREEN

// ============================================================



export default function BookRideScreen() {

  const { resumeRideId } =

    useLocalSearchParams<{

      resumeRideId?: string;

    }>();



  // ==========================================================

  // PICKUP LOCATION

  // ==========================================================



  const [pickupLocation, setPickupLocation] =

    useState("");



  const [pickupLatitude, setPickupLatitude] =

    useState<number | null>(null);



  const [pickupLongitude, setPickupLongitude] =

    useState<number | null>(null);



  // ==========================================================

  // DROP LOCATION

  // ==========================================================



  const [dropLocation, setDropLocation] =

    useState("");



  const [dropLatitude, setDropLatitude] =

    useState<number | null>(null);



  const [dropLongitude, setDropLongitude] =

    useState<number | null>(null);



  // ==========================================================

  // GENERAL STATES

  // ==========================================================



  const [gettingLocation, setGettingLocation] =

    useState(true);



  const [findingLocation, setFindingLocation] =

    useState(false);



  const [booking, setBooking] =

    useState(false);



  // ==========================================================

  // VEHICLE TYPES

  // ==========================================================



  const [vehicleTypes, setVehicleTypes] =

    useState<VehicleType[]>([]);



  const [selectedVehicleType, setSelectedVehicleType] =

    useState<VehicleType | null>(null);



  const [loadingVehicleTypes, setLoadingVehicleTypes] =

    useState(true);



  // ==========================================================

  // RIDE STATES

  // ==========================================================



  const [waitingForDriver, setWaitingForDriver] =

    useState(false);



  const [rideId, setRideId] =

    useState<string | null>(null);



  // ==========================================================

  // FIRESTORE LISTENER

  // ==========================================================



  const unsubscribeRef =

    useRef<(() => void) | null>(null);



  const navigatingRef =

    useRef(false);



  const resumedRideRef =

    useRef<string | null>(null);



  // ==========================================================

  // MAP

  // ==========================================================



  const mapRef =

    useRef<any>(null);



  const defaultMapRegion = {

    latitude: 8.5241,

    longitude: 76.9366,

    latitudeDelta: 0.08,

    longitudeDelta: 0.08,

  };



  const fitMapToLocations = () => {

    if (!mapRef.current) {

      return;

    }



    const coordinates: {

      latitude: number;

      longitude: number;

    }[] = [];



    if (

      pickupLatitude !== null &&

      pickupLongitude !== null

    ) {

      coordinates.push({

        latitude: pickupLatitude,

        longitude: pickupLongitude,

      });

    }



    if (

      dropLatitude !== null &&

      dropLongitude !== null

    ) {

      coordinates.push({

        latitude: dropLatitude,

        longitude: dropLongitude,

      });

    }



    if (coordinates.length === 1) {

      mapRef.current.animateToRegion?.(

        {

          latitude: coordinates[0].latitude,

          longitude: coordinates[0].longitude,

          latitudeDelta: 0.03,

          longitudeDelta: 0.03,

        },

        500

      );

      return;

    }



    if (coordinates.length >= 2) {

      mapRef.current.fitToCoordinates?.(

        coordinates,

        {

          edgePadding: {

            top: 60,

            right: 40,

            bottom: 60,

            left: 40,

          },

          animated: true,

        }

      );

    }

  };



  // ==========================================================

  // SCREEN LOAD

  // ==========================================================



  useEffect(() => {

    getCurrentLocation();

    loadVehicleTypes();



    return () => {

      stopRideListener();

    };

  }, []);



  // ==========================================================

  // LOAD VEHICLE TYPES FROM FIRESTORE

  // ==========================================================



  const loadVehicleTypes = async () => {

    try {

      setLoadingVehicleTypes(true);



      console.log(

        "LOADING VEHICLE TYPES FROM FIRESTORE..."

      );



      const vehicleTypesRef =

        collection(db, "vehicleTypes");



      const vehicleTypesQuery = query(

        vehicleTypesRef,

        where("isActive", "==", true)

      );



      const snapshot =

        await getDocs(vehicleTypesQuery);



      console.log(

        "VEHICLE TYPE DOCUMENTS:",

        snapshot.docs.length

      );



      const types: VehicleType[] =

        snapshot.docs.map((vehicleDoc) => {

          const data = vehicleDoc.data();



          return {

            id: vehicleDoc.id,

            name: data.name || "",

            code: data.code || "",

            icon: data.icon || "",

            isActive: data.isActive === true,



            // Tariff settings from vehicleTypes collection

            baseFare:

              typeof data.baseFare === "number"

                ? data.baseFare

                : Number(data.baseFare || 0),



            perKmRate:

              typeof data.perKmRate === "number"

                ? data.perKmRate

                : Number(data.perKmRate || 0),



            perMinuteRate:

              typeof data.perMinuteRate === "number"

                ? data.perMinuteRate

                : Number(data.perMinuteRate || 0),

          };

        });



      console.log(

        "ACTIVE VEHICLE TYPES:",

        types

      );



      setVehicleTypes(types);



      if (types.length > 0) {

        setSelectedVehicleType(types[0]);

      }

    } catch (error) {

      console.error(

        "ERROR LOADING VEHICLE TYPES:",

        error

      );



      Alert.alert(

        "Vehicle Types Error",

        "Unable to load vehicle types."

      );

    } finally {

      setLoadingVehicleTypes(false);

    }

  };



  // ==========================================================

  // RESUME EXISTING RIDE AFTER LOGIN

  // ==========================================================



  const resumeExistingRide = async (

    existingRideId: string

  ) => {

    if (

      resumedRideRef.current ===

      existingRideId

    ) {

      return;

    }



    resumedRideRef.current =

      existingRideId;



    try {

      console.log(

        "RESUMING EXISTING RIDE:",

        existingRideId

      );



      const rideRef = doc(

        db,

        "rides",

        existingRideId

      );



      const rideSnapshot =

        await getDoc(rideRef);



      if (!rideSnapshot.exists()) {

        resumedRideRef.current =

          null;



        Alert.alert(

          "Ride Not Found",

          "The existing ride could not be found."

        );



        return;

      }



      const ride =

        rideSnapshot.data();



      const currentUser =

        auth.currentUser;



      if (!currentUser) {

        resumedRideRef.current =

          null;



        router.replace(

          "/auth/login"

        );



        return;

      }



      if (

        ride.riderId !==

        currentUser.uid

      ) {

        resumedRideRef.current =

          null;



        Alert.alert(

          "Ride Error",

          "This ride does not belong to the current rider."

        );



        return;

      }



      const status =

        ride.status;



      const paymentStatus =

        ride.paymentStatus ||

        "pending";



      console.log(

        "RESUME RIDE STATUS:",

        status

      );



      console.log(

        "RESUME PAYMENT STATUS:",

        paymentStatus

      );



      // ------------------------------------------------------

      // Completed ride with payment pending

      // ------------------------------------------------------



      if (

        status === "completed" &&

        paymentStatus !== "paid"

      ) {

        console.log(

          "COMPLETED RIDE HAS PENDING PAYMENT"

        );



        setRideId(null);

        setWaitingForDriver(false);



        resumedRideRef.current =

          null;



        router.replace({

          pathname:

            "/payment",

          params: {

            rideId:

              existingRideId,

            amount: String(

              ride.fare ??

              ride.amount ??

              250

            ),

          },

        });



        return;

      }



      // ------------------------------------------------------

      // Completed and already paid

      // ------------------------------------------------------



      if (

        status === "completed" &&

        paymentStatus === "paid"

      ) {

        console.log(

          "RIDE COMPLETED AND PAYMENT ALREADY PAID"

        );



        setRideId(null);

        setWaitingForDriver(false);



        resumedRideRef.current =

          null;



        return;

      }



      // ------------------------------------------------------

      // Active ride

      // ------------------------------------------------------



      if (

        status === "accepted" ||

        status === "driverArrived" ||

        status === "inProgress"

      ) {

        resumedRideRef.current =

          null;



        router.replace({

          pathname:

            "/rideprogress",

          params: {

            rideId:

              existingRideId,

          },

        });



        return;

      }



      // ------------------------------------------------------

      // Requested ride

      // ------------------------------------------------------



      if (

        status !== "requested"

      ) {

        resumedRideRef.current =

          null;



        setRideId(null);

        setWaitingForDriver(false);



        return;

      }



      // ------------------------------------------------------

      // Restore ride details

      // ------------------------------------------------------



      setRideId(

        existingRideId

      );



      if (

        typeof ride.pickupLocation ===

        "string"

      ) {

        setPickupLocation(

          ride.pickupLocation

        );

      }



      if (

        typeof ride.pickupLatitude ===

        "number"

      ) {

        setPickupLatitude(

          ride.pickupLatitude

        );

      }



      if (

        typeof ride.pickupLongitude ===

        "number"

      ) {

        setPickupLongitude(

          ride.pickupLongitude

        );

      }



      if (

        typeof ride.dropLocation ===

        "string"

      ) {

        setDropLocation(

          ride.dropLocation

        );

      }



      if (

        typeof ride.dropLatitude ===

        "number"

      ) {

        setDropLatitude(

          ride.dropLatitude

        );

      }



      if (

        typeof ride.dropLongitude ===

        "number"

      ) {

        setDropLongitude(

          ride.dropLongitude

        );

      }



      if (

        ride.vehicleTypeId

      ) {

        const matchingVehicle =

          vehicleTypes.find(

            (vehicle) =>

              vehicle.id ===

              ride.vehicleTypeId

          );



        if (matchingVehicle) {

          setSelectedVehicleType(

            matchingVehicle

          );

        } else {

          setSelectedVehicleType({

            id:

              ride.vehicleTypeId,

            name:

              ride.vehicleType ||

              "Vehicle",

            code: "",

            icon: "",

            isActive: true,

          });

        }

      }



      setWaitingForDriver(

        true

      );



      navigatingRef.current =

        false;



      listenToRide(

        existingRideId

      );

    } catch (error) {

      console.error(

        "RESUME EXISTING RIDE ERROR:",

        error

      );



      resumedRideRef.current =

        null;



      Alert.alert(

        "Ride Resume Error",

        "Unable to restore your existing ride."

      );

    }

  };



  useEffect(() => {

    if (!resumeRideId) {

      return;

    }



    if (loadingVehicleTypes) {

      return;

    }



    resumeExistingRide(

      resumeRideId

    );

  }, [

    resumeRideId,

    loadingVehicleTypes,

  ]);



  // ==========================================================

  // GET CURRENT GPS LOCATION

  // ==========================================================



  const getCurrentLocation = async () => {

    try {

      setGettingLocation(true);



      console.log(

        "Requesting location permission..."

      );



      const { status } =

        await Location.requestForegroundPermissionsAsync();



      if (status !== "granted") {

        Alert.alert(

          "Location Permission Required",

          "Please allow location access to use your current location."

        );



        return;

      }



      const location =

        await Location.getCurrentPositionAsync({

          accuracy: Location.Accuracy.High,

        });



      const latitude =

        location.coords.latitude;



      const longitude =

        location.coords.longitude;



      console.log(

        "CURRENT LATITUDE:",

        latitude

      );



      console.log(

        "CURRENT LONGITUDE:",

        longitude

      );



      setPickupLatitude(latitude);

      setPickupLongitude(longitude);



      // ======================================================

      // REVERSE GEOCODE

      // ======================================================



      try {

        const addresses =

          await Location.reverseGeocodeAsync({

            latitude,

            longitude,

          });



        console.log(

          "CURRENT LOCATION ADDRESS:",

          addresses

        );



        if (addresses.length > 0) {

          const address =

            addresses[0];



          const parts = [

            address.name,

            address.street,

            address.district,

            address.city,

            address.region,

            address.postalCode,

          ].filter(Boolean);



          const formattedAddress =

            parts.join(", ");



          setPickupLocation(

            formattedAddress ||

              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

          );

        } else {

          setPickupLocation(

            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

          );

        }

      } catch (error) {

        console.log(

          "REVERSE GEOCODING ERROR:",

          error

        );



        setPickupLocation(

          `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

        );

      }

    } catch (error) {

      console.log(

        "CURRENT LOCATION ERROR:",

        error

      );



      Alert.alert(

        "Location Error",

        "Unable to get your current location."

      );

    } finally {

      setGettingLocation(false);

    }

  };



  // ==========================================================

  // FIND PICKUP LOCATION

  // ==========================================================



  const findPickupLocation = async () => {

    const searchText = pickupLocation.trim();



    if (!searchText) {

      Alert.alert(

        "Enter Pickup Location",

        "Please enter a place or address in the Pickup Location box."

      );



      return;

    }



    try {

      setFindingLocation(true);



      console.log(

        "Searching for pickup location:",

        searchText

      );



      const url =

        "https://photon.komoot.io/api/?q=" +

        encodeURIComponent(searchText) +

        "&limit=5";



      const response = await fetch(url);



      console.log(

        "PICKUP LOCATION SEARCH STATUS:",

        response.status

      );



      if (!response.ok) {

        throw new Error(

          `Location search failed: ${response.status}`

        );

      }



      const data = await response.json();



      console.log(

        "PICKUP LOCATION SEARCH RESULT:",

        JSON.stringify(data)

      );



      if (

        !data.features ||

        data.features.length === 0

      ) {

        Alert.alert(

          "Location Not Found",

          `Could not find "${searchText}". Try entering a more specific place or address.`

        );



        return;

      }



      const result = data.features[0];



      const coordinates =

        result.geometry?.coordinates;



      if (

        !coordinates ||

        coordinates.length < 2

      ) {

        Alert.alert(

          "Location Error",

          "The location was found, but coordinates were not available."

        );



        return;

      }



      const longitude = Number(coordinates[0]);

      const latitude = Number(coordinates[1]);



      console.log(

        "PICKUP LATITUDE:",

        latitude

      );



      console.log(

        "PICKUP LONGITUDE:",

        longitude

      );



      setPickupLatitude(latitude);

      setPickupLongitude(longitude);



      const properties =

        result.properties || {};



      const addressParts = [

        properties.name,

        properties.street,

        properties.city,

        properties.district,

        properties.state,

        properties.country,

      ].filter(Boolean);



      const foundAddress =

        addressParts.join(", ");



      if (foundAddress) {

        setPickupLocation(foundAddress);

      }



      Alert.alert(

        "Pickup Location Found",

        foundAddress || searchText

      );

    } catch (error) {

      console.log(

        "FIND PICKUP LOCATION ERROR:",

        error

      );



      Alert.alert(

        "Location Error",

        "Unable to search for this pickup location. Please check your internet connection."

      );

    } finally {

      setFindingLocation(false);

    }

  };



  // ==========================================================

  // FIND DROP LOCATION

  // ==========================================================



  const findDropLocation = async () => {

    const searchText =

      dropLocation.trim();



    if (!searchText) {

      Alert.alert(

        "Enter Drop Location",

        "Please enter a place or address in the Drop Location box."

      );



      return;

    }



    try {

      setFindingLocation(true);



      console.log(

        "Searching for drop location:",

        searchText

      );



      const url =

        "https://photon.komoot.io/api/?q=" +

        encodeURIComponent(searchText) +

        "&limit=5";



      console.log(

        "LOCATION SEARCH URL:",

        url

      );



      const response =

        await fetch(url);



      console.log(

        "LOCATION SEARCH STATUS:",

        response.status

      );



      if (!response.ok) {

        throw new Error(

          `Location search failed: ${response.status}`

        );

      }



      const data =

        await response.json();



      console.log(

        "LOCATION SEARCH RESULT:",

        JSON.stringify(data)

      );



      if (

        !data.features ||

        data.features.length === 0

      ) {

        Alert.alert(

          "Location Not Found",

          `Could not find "${searchText}". Try entering a more specific place or address.`

        );



        return;

      }



      const result =

        data.features[0];



      const coordinates =

        result.geometry?.coordinates;



      if (

        !coordinates ||

        coordinates.length < 2

      ) {

        Alert.alert(

          "Location Error",

          "The location was found, but coordinates were not available."

        );



        return;

      }



      const longitude =

        Number(coordinates[0]);



      const latitude =

        Number(coordinates[1]);



      console.log(

        "DROP LATITUDE:",

        latitude

      );



      console.log(

        "DROP LONGITUDE:",

        longitude

      );



      setDropLatitude(latitude);

      setDropLongitude(longitude);



      const properties =

        result.properties || {};



      const addressParts = [

        properties.name,

        properties.street,

        properties.city,

        properties.district,

        properties.state,

        properties.country,

      ].filter(Boolean);



      const foundAddress =

        addressParts.join(", ");



      if (foundAddress) {

        setDropLocation(

          foundAddress

        );

      }



      Alert.alert(

        "Location Found",

        foundAddress || searchText

      );

    } catch (error) {

      console.log(

        "FIND LOCATION ERROR:",

        error

      );



      Alert.alert(

        "Location Error",

        "Unable to search for this location. Please check your internet connection."

      );

    } finally {

      setFindingLocation(false);

    }

  };



  // ==========================================================

  // CALCULATE DISTANCE

  // ==========================================================



  const calculateDistanceKm = (

    lat1: number,

    lon1: number,

    lat2: number,

    lon2: number

  ) => {

    const R = 6371;



    const dLat =

      ((lat2 - lat1) * Math.PI) /

      180;



    const dLon =

      ((lon2 - lon1) * Math.PI) /

      180;



    const a =

      Math.sin(dLat / 2) *

        Math.sin(dLat / 2) +

      Math.cos(

        (lat1 * Math.PI) / 180

      ) *

        Math.cos(

          (lat2 * Math.PI) / 180

        ) *

        Math.sin(dLon / 2) *

        Math.sin(dLon / 2);



    const c =

      2 *

      Math.atan2(

        Math.sqrt(a),

        Math.sqrt(1 - a)

      );



    return R * c;

  };



  // ==========================================================

  // ESTIMATED FARE

  // ==========================================================



  const estimatedDistanceKm =

    pickupLatitude !== null &&

    pickupLongitude !== null &&

    dropLatitude !== null &&

    dropLongitude !== null

      ? calculateDistanceKm(

          pickupLatitude,

          pickupLongitude,

          dropLatitude,

          dropLongitude

        )

      : null;



  const estimatedFare =

    selectedVehicleType &&

    estimatedDistanceKm !== null

      ? Math.round(

          (

            selectedVehicleType.baseFare +

            estimatedDistanceKm *

              selectedVehicleType.perKmRate

          ) * 100

        ) / 100

      : null;



  // ==========================================================

  // FIND NEAREST AVAILABLE DRIVER

  // ==========================================================



  const findNearestDriver = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      console.log(
        "Finding nearest available driver..."
      );

      if (!selectedVehicleType) {
        console.log(
          "No rider vehicle type selected."
        );
        return null;
      }

      const requestedVehicleType =
        selectedVehicleType.name
          .trim()
          .toLowerCase();

      const requestedVehicleCode =
        selectedVehicleType.code
          ?.trim()
          .toLowerCase() || "";

      console.log(
        "REQUESTED VEHICLE TYPE:",
        selectedVehicleType.name,
        "CODE:",
        selectedVehicleType.code
      );

      // Find available drivers. We check isOnline in memory
      // to avoid requiring a Firestore composite index.
      const driversQuery = query(
        collection(db, "drivers"),
        where("isAvailable", "==", true)
      );

      const snapshot = await getDocs(
        driversQuery
      );

      console.log(
        "Available drivers found:",
        snapshot.size
      );

      if (snapshot.empty) {
        console.log(
          "No available drivers."
        );
        return null;
      }

      let nearestDriver: any = null;
      let shortestDistance = Infinity;

      // We must use for...of because the active vehicle
      // lookup is asynchronous.
      for (const driverDoc of snapshot.docs) {
        const driver = driverDoc.data();

        console.log(
          "Checking driver:",
          driverDoc.id,
          driver.fullName || ""
        );

        // DRIVER MUST BE ONLINE
        if (driver.isOnline !== true) {
          console.log(
            "Skipping offline driver:",
            driverDoc.id
          );
          continue;
        }

        // DRIVER MUST HAVE VALID GPS
        if (
          typeof driver.latitude !== "number" ||
          typeof driver.longitude !== "number"
        ) {
          console.log(
            "Driver has no valid GPS:",
            driverDoc.id
          );
          continue;
        }

        // FIND DRIVER'S ACTIVE VEHICLE
        const vehiclesQuery = query(
          collection(
            db,
            "drivers",
            driverDoc.id,
            "vehicles"
          ),
          where("isActive", "==", true)
        );

        const vehiclesSnapshot =
          await getDocs(vehiclesQuery);

        if (vehiclesSnapshot.empty) {
          console.log(
            "Skipping driver - no active vehicle:",
            driverDoc.id
          );
          continue;
        }

        const activeVehicle =
          vehiclesSnapshot.docs[0].data();

        // Vehicle type may be stored in vehicleType,
        // category, or code depending on the vehicle record.
        const driverVehicleType =
          String(
            activeVehicle.vehicleType || ""
          )
            .trim()
            .toLowerCase();

        const driverVehicleCategory =
          String(
            activeVehicle.category || ""
          )
            .trim()
            .toLowerCase();

        const driverVehicleCode =
          String(
            activeVehicle.code || ""
          )
            .trim()
            .toLowerCase();

        const vehicleTypeMatches =
          driverVehicleType ===
            requestedVehicleType ||
          driverVehicleCategory ===
            requestedVehicleType ||
          driverVehicleCode ===
            requestedVehicleType ||
          (requestedVehicleCode !== "" &&
            (driverVehicleType ===
              requestedVehicleCode ||
              driverVehicleCategory ===
                requestedVehicleCode ||
              driverVehicleCode ===
                requestedVehicleCode));

        console.log(
          "Driver vehicle:",
          activeVehicle.make || "",
          activeVehicle.model || "",
          "| Type:",
          activeVehicle.vehicleType || "",
          "| Category:",
          activeVehicle.category || "",
          "| Requested:",
          selectedVehicleType.name,
          "| Match:",
          vehicleTypeMatches
        );

        // VEHICLE TYPE MUST MATCH RIDER REQUEST
        if (!vehicleTypeMatches) {
          console.log(
            "Skipping driver - vehicle type mismatch:",
            driverDoc.id
          );
          continue;
        }

        // CALCULATE DISTANCE
        const distance =
          calculateDistanceKm(
            latitude,
            longitude,
            driver.latitude,
            driver.longitude
          );

        console.log(
          "Eligible driver:",
          driverDoc.id,
          "Distance:",
          distance.toFixed(2),
          "km"
        );

        // KEEP THE NEAREST MATCHING DRIVER
        if (
          distance < shortestDistance
        ) {
          shortestDistance =
            distance;

          nearestDriver = {
            id: driverDoc.id,
            ...driver,
            activeVehicle,
            distanceKm: distance,
          };
        }
      }

      if (!nearestDriver) {
        console.log(
          "No online driver with matching vehicle type and valid GPS."
        );
        return null;
      }

      console.log(
        "NEAREST MATCHING DRIVER:",
        nearestDriver.id
      );

      console.log(
        "DRIVER NAME:",
        nearestDriver.fullName || ""
      );

      console.log(
        "DRIVER VEHICLE:",
        nearestDriver.activeVehicle?.make || "",
        nearestDriver.activeVehicle?.model || ""
      );

      console.log(
        "DRIVER VEHICLE TYPE:",
        nearestDriver.activeVehicle?.vehicleType || ""
      );

      console.log(
        "DISTANCE:",
        nearestDriver.distanceKm.toFixed(2),
        "km"
      );

      return nearestDriver;
    } catch (error) {
      console.error(
        "FIND NEAREST DRIVER ERROR:",
        error
      );

      return null;
    }
  };



  // ==========================================================
  // CHECK ACTIVE RIDE
  // ==========================================================




  // ==========================================================



  const hasActiveRide = async (

    riderId: string

  ) => {

    try {

      console.log(

        "Checking active rides..."

      );



      const activeRideQuery =

        query(

          collection(

            db,

            "rides"

          ),

          where(

            "riderId",

            "==",

            riderId

          ),

          where(

            "status",

            "in",

            [

              "requested",

              "accepted",

              "driverArrived",

              "inProgress",

            ]

          )

        );



      const snapshot =

        await getDocs(

          activeRideQuery

        );



      console.log(

        "Active rides found:",

        snapshot.size

      );



      return !snapshot.empty;

    } catch (error) {

      console.error(

        "ACTIVE RIDE CHECK ERROR:",

        error

      );



      throw error;

    }

  };



  // ==========================================================

  // BOOK RIDE

  // ==========================================================



  const handleBookRide = async () => {

    // --------------------------------------------------------

    // Pickup validation

    // --------------------------------------------------------



    if (

      pickupLatitude === null ||

      pickupLongitude === null

    ) {

      Alert.alert(

        "Pickup Location",

        "Please wait for the current location to load."

      );



      return;

    }



    // --------------------------------------------------------

    // Drop validation

    // --------------------------------------------------------



    if (!dropLocation.trim()) {

      Alert.alert(

        "Drop Location",

        "Please enter your destination."

      );



      return;

    }



    if (

      dropLatitude === null ||

      dropLongitude === null

    ) {

      Alert.alert(

        "Find Location",

        "Please press Find before booking."

      );



      return;

    }



    // --------------------------------------------------------

    // Vehicle validation

    // --------------------------------------------------------



    if (!selectedVehicleType) {

      Alert.alert(

        "Vehicle Type",

        "Please select a vehicle type."

      );



      return;

    }



    // --------------------------------------------------------

    // Firebase authentication

    // --------------------------------------------------------



    const currentUser =

      auth.currentUser;



    if (!currentUser) {

      Alert.alert(

        "Login Required",

        "Please login again."

      );



      router.replace(

        "../login"

      );



      return;

    }



    try {

      setBooking(true);



      const riderId =

        currentUser.uid;



      const riderEmail =

        currentUser.email || "";



      console.log(

        "RIDER FIREBASE UID:",

        riderId

      );



      // ------------------------------------------------------

      // Check existing active ride

      // ------------------------------------------------------



      const alreadyHasRide =

        await hasActiveRide(

          riderId

        );



      if (alreadyHasRide) {

        Alert.alert(

          "Active Ride",

          "You already have an active ride. Please complete or cancel it before booking another ride."

        );



        return;

      }

      // ------------------------------------------------------

      // Driver assignment happens only after a driver accepts.

      // The ride is created with driverId = null.

      // ------------------------------------------------------

      // Ride data

      // ------------------------------------------------------



      const rideData = {

        riderId:

          riderId,



        riderEmail:

          riderEmail,



        // Vehicle master information

        vehicleTypeId:

          selectedVehicleType.id,



        vehicleType:

          selectedVehicleType.name,



        // Tariff information used for this ride

        baseFare:

          selectedVehicleType.baseFare,



        perKmRate:

          selectedVehicleType.perKmRate,



        perMinuteRate:

          selectedVehicleType.perMinuteRate,



        estimatedDistanceKm:

          estimatedDistanceKm !== null

            ? Number(

                estimatedDistanceKm.toFixed(2)

              )

            : null,



        estimatedFare:

          estimatedFare !== null

            ? estimatedFare

            : null,



        pickupLocation:

          pickupLocation.trim(),



        pickupLatitude:

          pickupLatitude,



        pickupLongitude:

          pickupLongitude,



        dropLocation:

          dropLocation.trim(),



        dropLatitude:

          dropLatitude,



        dropLongitude:

          dropLongitude,



        // Driver
        // No driver is assigned at booking time.
        // A nearby eligible driver will claim the ride later.

        driverId:

          null,

        driverName:

          null,

        driverLatitude:

          null,

        driverLongitude:

          null,



        // Ride status

        status:

          "requested",



        createdAt:

          serverTimestamp(),



        acceptedAt:

          null,



        startedAt:

          null,



        completedAt:

          null,



        // Payment

        paymentStatus:

          "pending",



        paymentId:

          null,



        razorpayOrderId:

          null,



        razorpayPaymentId:

          null,



        paymentVerifiedAt:

          null,

      };



      console.log(

        "CREATING RIDE:",

        rideData

      );



      // ------------------------------------------------------

      // Create ride

      // ------------------------------------------------------



      const rideRef =

        await addDoc(

          collection(

            db,

            "rides"

          ),

          rideData

        );



      const newRideId =

        rideRef.id;



      console.log(

        "RIDE CREATED:",

        newRideId

      );



      console.log(

        "RIDE CREATED WITHOUT DRIVER. Waiting for nearby driver acceptance.",

        newRideId

      );



      // ------------------------------------------------------

      // Update UI

      // ------------------------------------------------------



      setRideId(

        newRideId

      );



      setWaitingForDriver(

        true

      );



      navigatingRef.current =

        false;



      // ------------------------------------------------------

      // Listen for ride updates

      // ------------------------------------------------------



      listenToRide(

        newRideId

      );

    } catch (error: any) {

      console.log(

        "CREATE RIDE ERROR:",

        error

      );



      if (

        error?.message?.includes(

          "index"

        )

      ) {

        Alert.alert(

          "Firestore Index Required",

          "Firebase needs a Firestore index for the active ride check. Please open the Firebase index link shown in the console."

        );

      } else {

        Alert.alert(

          "Booking Error",

          "Unable to create the ride. Please try again."

        );

      }

    } finally {

      setBooking(false);

    }

  };



  // ==========================================================

  // LISTEN TO RIDE

  // ==========================================================



  const listenToRide = (

    currentRideId: string

  ) => {

    stopRideListener();



    console.log(

      "STARTING REAL-TIME RIDE LISTENER:",

      currentRideId

    );



    const rideRef =

      doc(

        db,

        "rides",

        currentRideId

      );



    const unsubscribe =

      onSnapshot(

        rideRef,

        (snapshot) => {

          if (!snapshot.exists()) {

            console.log(

              "Ride document does not exist."

            );



            return;

          }



          const ride =

            snapshot.data();



          console.log(

            "REAL-TIME RIDE UPDATE:",

            ride

          );



          const status =

            ride.status;



          console.log(

            "CURRENT RIDE STATUS:",

            status

          );



          // ==================================================

          // DRIVER ACCEPTED

          // ==================================================



          if (

            status === "accepted" &&

            !navigatingRef.current

          ) {

            console.log(

              "DRIVER ACCEPTED RIDE"

            );



            navigatingRef.current =

              true;



            stopRideListener();



            setWaitingForDriver(

              false

            );



            router.push({

              pathname:

                "/rideprogress",

              params: {

                rideId:

                  currentRideId,

              },

            });



            return;

          }



          // ==================================================

          // DRIVER ARRIVED

          // ==================================================



          if (

            status ===

              "driverArrived" &&

            !navigatingRef.current

          ) {

            console.log(

              "DRIVER ARRIVED"

            );



            navigatingRef.current =

              true;



            stopRideListener();



            setWaitingForDriver(

              false

            );



            router.push({

              pathname:

                "/rideprogress",

              params: {

                rideId:

                  currentRideId,

              },

            });



            return;

          }



          // ==================================================

          // RIDE STARTED

          // ==================================================



          if (

            status === "inProgress" &&

            !navigatingRef.current

          ) {

            console.log(

              "RIDE STARTED"

            );



            navigatingRef.current =

              true;



            stopRideListener();



            setWaitingForDriver(

              false

            );



            router.push({

              pathname:

                "/rideprogress",

              params: {

                rideId:

                  currentRideId,

              },

            });



            return;

          }



          // ==================================================

          // RIDE CANCELLED

          // ==================================================



          if (

            status === "cancelled" ||

            status === "canceled"

          ) {

            console.log(

              "RIDE CANCELLED"

            );



            stopRideListener();



            setWaitingForDriver(

              false

            );



            setRideId(null);



            navigatingRef.current =

              false;



            Alert.alert(

              "Ride Cancelled",

              "The ride has been cancelled."

            );



            return;

          }



          // ==================================================

          // RIDE COMPLETED

          // ==================================================



          if (

            status === "completed"

          ) {

            console.log(

              "RIDE COMPLETED"

            );



            stopRideListener();



            setWaitingForDriver(

              false

            );



            setRideId(null);



            navigatingRef.current =

              false;



            return;

          }

        },

        (error) => {

          console.log(

            "FIRESTORE RIDE LISTENER ERROR:",

            error

          );



          Alert.alert(

            "Real-time Error",

            "Unable to listen for ride updates."

          );

        }

      );



    unsubscribeRef.current =

      unsubscribe;

  };



  // ==========================================================

  // STOP RIDE LISTENER

  // ==========================================================



  const stopRideListener = () => {

    if (

      unsubscribeRef.current

    ) {

      unsubscribeRef.current();



      unsubscribeRef.current =

        null;

    }

  };



  // ==========================================================

  // CANCEL RIDE

  // ==========================================================



  const handleCancel = async () => {

    if (!rideId) {

      return;

    }



    try {

      console.log(

        "Cancelling ride:",

        rideId

      );



      const rideRef =

        doc(

          db,

          "rides",

          rideId

        );



      await updateDoc(

        rideRef,

        {

          status:

            "cancelled",



          cancelledAt:

            serverTimestamp(),

        }

      );



      console.log(

        "Ride cancelled in Firestore."

      );



      stopRideListener();



      setWaitingForDriver(

        false

      );



      setRideId(null);



      navigatingRef.current =

        false;



      Alert.alert(

        "Ride Cancelled",

        "Your ride has been cancelled."

      );

    } catch (error) {

      console.error(

        "CANCEL RIDE ERROR:",

        error

      );



      Alert.alert(

        "Cancellation Error",

        "Unable to cancel the ride. Please try again."

      );

    }

  };



  // ==========================================================

  // UI

  // ==========================================================



  return (

    <ScrollView

      contentContainerStyle={

        styles.container

      }

      keyboardShouldPersistTaps="handled"

      showsVerticalScrollIndicator={true}

    >

      {/* ====================================================

          BACK BUTTON

      ==================================================== */}



      <TouchableOpacity

        style={

          styles.backButton

        }

        onPress={() => {

          router.replace("/");

        }}

      >

        <Text

          style={

            styles.backButtonText

          }

        >

          ← Back

        </Text>

      </TouchableOpacity>



      {/* ====================================================

          TITLE

      ==================================================== */}



      <Text

        style={styles.title}

      >

        Book a Ride

      </Text>



      {!waitingForDriver && (

        <>

          {/* ==================================================

              PICKUP LOCATION

          ================================================== */}



          <Text

            style={styles.label}

          >

            Pickup Location

          </Text>



          <View

            style={styles.dropRow}

          >

            <TextInput

              style={styles.dropInput}

              placeholder={

                gettingLocation

                  ? "Getting current location..."

                  : "Enter pickup location"

              }

              value={pickupLocation}

              onChangeText={(text) => {

                setPickupLocation(text);



                // The typed address may no longer match the

                // previously selected GPS coordinates.

                setPickupLatitude(null);

                setPickupLongitude(null);

              }}

              editable={!gettingLocation}

            />



            <TouchableOpacity

              style={styles.findButton}

              onPress={findPickupLocation}

              disabled={

                findingLocation ||

                gettingLocation

              }

            >

              {findingLocation ? (

                <ActivityIndicator

                  size="small"

                  color="#fff"

                />

              ) : (

                <Text

                  style={styles.findButtonText}

                >

                  Find

                </Text>

              )}

            </TouchableOpacity>

          </View>



          <TouchableOpacity

            style={styles.currentLocationButton}

            onPress={getCurrentLocation}

            disabled={gettingLocation}

          >

            <Text

              style={styles.currentLocationText}

            >

              📍 Use Current Location

            </Text>

          </TouchableOpacity>



          {pickupLatitude !== null &&

            pickupLongitude !== null && (

              <Text

                style={styles.coordinates}

              >

                Pickup GPS:{" "}

                {pickupLatitude.toFixed(6)}

                ,{" "}

                {pickupLongitude.toFixed(6)}

              </Text>

            )}



          {/* ==================================================

              DROP LOCATION

          ================================================== */}



          <Text

            style={styles.label}

          >

            Drop Location

          </Text>



          <View

            style={

              styles.dropRow

            }

          >

            <TextInput

              style={

                styles.dropInput

              }

              placeholder="Enter destination"

              value={

                dropLocation

              }

              onChangeText={(

                text

              ) => {

                setDropLocation(

                  text

                );



                setDropLatitude(

                  null

                );



                setDropLongitude(

                  null

                );

              }}

            />



            <TouchableOpacity

              style={

                styles.findButton

              }

              onPress={

                findDropLocation

              }

              disabled={

                findingLocation

              }

            >

              {findingLocation ? (

                <ActivityIndicator

                  size="small"

                  color="#fff"

                />

              ) : (

                <Text

                  style={

                    styles.findButtonText

                  }

                >

                  Find

                </Text>

              )}

            </TouchableOpacity>

          </View>



          {dropLatitude !==

            null &&

            dropLongitude !==

              null && (

              <Text

                style={

                  styles.coordinates

                }

              >

                Drop GPS:{" "}

                {dropLatitude.toFixed(

                  6

                )}

                ,{" "}

                {dropLongitude.toFixed(

                  6

                )}

              </Text>

            )}



          {/* ==================================================

              MAP

          ================================================== */}



          <Text

            style={styles.label}

          >

            Map

          </Text>



          <RideMap

            mapRef={mapRef}

            defaultMapRegion={defaultMapRegion}

            pickupLatitude={pickupLatitude}

            pickupLongitude={pickupLongitude}

            pickupLocation={pickupLocation}

            dropLatitude={dropLatitude}

            dropLongitude={dropLongitude}

            dropLocation={dropLocation}

            onMapReady={fitMapToLocations}

          />



          {/* ==================================================

              VEHICLE TYPE

          ================================================== */}



          <Text

            style={styles.label}

          >

            Select Vehicle

          </Text>



          {loadingVehicleTypes ? (

            <View

              style={

                styles.vehicleLoadingContainer

              }

            >

              <ActivityIndicator

                size="small"

              />



              <Text

                style={

                  styles.vehicleLoadingText

                }

              >

                Loading vehicle types...

              </Text>

            </View>

          ) : vehicleTypes.length ===

            0 ? (

            <View

              style={

                styles.noVehicleContainer

              }

            >

              <Text

                style={

                  styles.noVehicleText

                }

              >

                No active vehicle types available.

              </Text>

            </View>

          ) : (

            <View

              style={

                styles.vehicleTypeContainer

              }

            >

              {vehicleTypes.map(

                (vehicleType) => {

                  const selected =

                    selectedVehicleType?.id ===

                    vehicleType.id;



                  return (

                    <TouchableOpacity

                      key={

                        vehicleType.id

                      }

                      style={[

                        styles.vehicleTypeButton,

                        selected &&

                          styles.selectedVehicleTypeButton,

                      ]}

                      onPress={() =>

                        setSelectedVehicleType(

                          vehicleType

                        )

                      }

                    >

                      <Text

                        style={[

                          styles.vehicleTypeText,

                          selected &&

                            styles.selectedVehicleTypeText,

                        ]}

                      >

                        {vehicleType.icon

                          ? `${vehicleType.icon} `

                          : ""}

                        {vehicleType.name}

                      </Text>

                    </TouchableOpacity>

                  );

                }

              )}

            </View>

          )}



          {/* ==================================================

              ESTIMATED FARE

          ================================================== */}



          {selectedVehicleType && (

            <View style={styles.fareCard}>

              <Text style={styles.fareTitle}>

                Estimated Fare

              </Text>



              {estimatedFare !== null ? (

                <>

                  <Text style={styles.fareAmount}>

                    ₹{estimatedFare.toFixed(2)}

                  </Text>



                  <Text style={styles.fareDetails}>

                    {selectedVehicleType.name}: ₹

                    {selectedVehicleType.baseFare.toFixed(

                      2

                    )} base + ₹

                    {selectedVehicleType.perKmRate.toFixed(

                      2

                    )}

                    /km

                  </Text>



                  <Text style={styles.fareDetails}>

                    Estimated distance:{" "}

                    {estimatedDistanceKm!.toFixed(2)} km

                  </Text>

                </>

              ) : (

                <Text style={styles.fareDetails}>

                  Enter and find a drop location to see

                  the estimated fare.

                </Text>

              )}

            </View>

          )}



          {/* ==================================================

              BOOK RIDE

          ================================================== */}



          <TouchableOpacity

            style={[

              styles.bookButton,

              (booking ||

                gettingLocation ||

                findingLocation ||

                loadingVehicleTypes ||

                !selectedVehicleType) &&

                styles.disabledButton,

            ]}

            onPress={

              handleBookRide

            }

            disabled={

              booking ||

              gettingLocation ||

              findingLocation ||

              loadingVehicleTypes ||

              !selectedVehicleType

            }

          >

            {booking ? (

              <ActivityIndicator

                color="#fff"

              />

            ) : (

              <Text

                style={

                  styles.bookButtonText

                }

              >

                Book Ride

              </Text>

            )}

          </TouchableOpacity>

        </>

      )}



      {/* ====================================================

          WAITING FOR DRIVER

      ==================================================== */}



      {waitingForDriver && (

        <View

          style={

            styles.waitingContainer

          }

        >

          <ActivityIndicator

            size="large"

          />



          <Text

            style={

              styles.waitingTitle

            }

          >

            Waiting for Driver

          </Text>



          <Text

            style={

              styles.waitingText

            }

          >

            Your ride has been created.

          </Text>



          <Text

            style={

              styles.waitingText

            }

          >

            Waiting for a driver to accept your ride...

          </Text>



          {selectedVehicleType && (

            <Text

              style={

                styles.selectedVehicleWaiting

              }

            >

              Vehicle:{" "}

              {selectedVehicleType.name}

            </Text>

          )}



          {rideId && (

            <Text

              style={

                styles.rideId

              }

            >

              Ride ID: {rideId}

            </Text>

          )}



          <Text

            style={

              styles.realtimeText

            }

          >

            ● Listening for driver

          </Text>



          <TouchableOpacity

            style={

              styles.cancelButton

            }

            onPress={

              handleCancel

            }

          >

            <Text

              style={

                styles.cancelButtonText

              }

            >

              Cancel

            </Text>

          </TouchableOpacity>

        </View>

      )}

    </ScrollView>

  );

}



// ============================================================

// STYLES

// ============================================================



const styles =

  StyleSheet.create({

    container: {

      flexGrow: 1,

      padding: 20,

      paddingBottom: 50,

      backgroundColor: "#fff",

    },



    backButton: {

      alignSelf: "flex-start",

      paddingVertical: 8,

      paddingHorizontal: 4,

      marginBottom: 5,

    },



    backButtonText: {

      color: "#007AFF",

      fontSize: 16,

      fontWeight: "600",

    },



    title: {

      fontSize: 28,

      fontWeight: "bold",

      marginBottom: 30,

      textAlign: "center",

    },



    label: {

      fontSize: 16,

      fontWeight: "600",

      marginBottom: 8,

      marginTop: 10,

    },



    locationRow: {

      flexDirection: "row",

      alignItems: "center",

      borderWidth: 1,

      borderColor: "#ccc",

      borderRadius: 8,

      paddingRight: 12,

      marginBottom: 5,

    },



    locationInput: {

      flex: 1,

      padding: 14,

      fontSize: 16,

    },



    currentLocationButton: {

      alignSelf: "flex-start",

      paddingVertical: 8,

      paddingHorizontal: 5,

      marginBottom: 5,

    },



    currentLocationText: {

      color: "#007AFF",

      fontSize: 15,

      fontWeight: "600",

    },



    dropRow: {

      flexDirection: "row",

      alignItems: "center",

      marginBottom: 5,

    },



    dropInput: {

      flex: 1,

      borderWidth: 1,

      borderColor: "#ccc",

      borderRadius: 8,

      padding: 14,

      fontSize: 16,

      marginRight: 8,

    },



    findButton: {

      backgroundColor: "#34C759",

      paddingVertical: 14,

      paddingHorizontal: 18,

      borderRadius: 8,

      minWidth: 70,

      alignItems: "center",

    },



    findButtonText: {

      color: "#fff",

      fontSize: 15,

      fontWeight: "bold",

    },



    coordinates: {

      fontSize: 12,

      color: "#777",

      marginBottom: 10,

    },



    // ========================================================

    // VEHICLE TYPES

    // ========================================================



    vehicleLoadingContainer: {

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      paddingVertical: 20,

      marginBottom: 10,

    },



    vehicleLoadingText: {

      marginLeft: 10,

      fontSize: 15,

      color: "#666",

    },



    noVehicleContainer: {

      padding: 15,

      borderWidth: 1,

      borderColor: "#ddd",

      borderRadius: 8,

      marginBottom: 10,

    },



    noVehicleText: {

      textAlign: "center",

      color: "#777",

      fontSize: 15,

    },



    vehicleTypeContainer: {

      flexDirection: "row",

      flexWrap: "wrap",

      justifyContent: "space-between",

      marginBottom: 10,

    },



    vehicleTypeButton: {

      width: "48%",

      borderWidth: 1,

      borderColor: "#ccc",

      borderRadius: 8,

      paddingVertical: 14,

      paddingHorizontal: 5,

      alignItems: "center",

      marginBottom: 10,

      backgroundColor: "#fff",

    },



    selectedVehicleTypeButton: {

      backgroundColor: "#007AFF",

      borderColor: "#007AFF",

    },



    vehicleTypeText: {

      fontSize: 16,

      fontWeight: "600",

      color: "#333",

      textAlign: "center",

    },



    selectedVehicleTypeText: {

      color: "#fff",

    },



    // ========================================================

    // ESTIMATED FARE

    // ========================================================



    fareCard: {

      borderWidth: 1,

      borderColor: "#ddd",

      borderRadius: 10,

      padding: 15,

      marginTop: 5,

      marginBottom: 10,

      backgroundColor: "#f8f8f8",

    },



    fareTitle: {

      fontSize: 16,

      fontWeight: "600",

      marginBottom: 5,

    },



    fareAmount: {

      fontSize: 28,

      fontWeight: "bold",

      color: "#007AFF",

      marginBottom: 5,

    },



    fareDetails: {

      fontSize: 13,

      color: "#666",

      marginTop: 3,

    },



    // ========================================================

    // BOOK BUTTON

    // ========================================================



    bookButton: {

      backgroundColor: "#007AFF",

      padding: 16,

      borderRadius: 8,

      alignItems: "center",

      marginTop: 20,

    },



    disabledButton: {

      opacity: 0.6,

    },



    bookButtonText: {

      color: "#fff",

      fontSize: 18,

      fontWeight: "bold",

    },



    // ========================================================

    // WAITING

    // ========================================================



    waitingContainer: {

      flex: 1,

      justifyContent: "center",

      alignItems: "center",

      paddingHorizontal: 20,

    },



    waitingTitle: {

      fontSize: 24,

      fontWeight: "bold",

      marginTop: 20,

      marginBottom: 10,

    },



    waitingText: {

      fontSize: 16,

      textAlign: "center",

      marginBottom: 8,

      color: "#555",

    },



    selectedVehicleWaiting: {

      fontSize: 15,

      fontWeight: "600",

      marginTop: 10,

      color: "#333",

    },



    rideId: {

      fontSize: 14,

      marginTop: 15,

      color: "#777",

    },



    realtimeText: {

      marginTop: 10,

      color: "#34C759",

      fontSize: 14,

      fontWeight: "600",

    },



    cancelButton: {

      marginTop: 30,

      borderWidth: 1,

      borderColor: "#FF3B30",

      paddingVertical: 12,

      paddingHorizontal: 40,

      borderRadius: 8,

    },



    cancelButtonText: {

      color: "#FF3B30",

      fontSize: 16,

      fontWeight: "600",

    },

  });
