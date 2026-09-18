import * as Location from "expo-location";

import { router } from "expo-router";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,

  Alert,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from "react-native";



import { auth, db } from "../../services/firebase";



export default function BookRideScreen() {

  // =========================================================

  // PICKUP LOCATION

  // =========================================================



  const [pickupLocation, setPickupLocation] = useState("");

  const [pickupLatitude, setPickupLatitude] =

    useState<number | null>(null);

  const [pickupLongitude, setPickupLongitude] =

    useState<number | null>(null);



  // =========================================================

  // DROP LOCATION

  // =========================================================



  const [dropLocation, setDropLocation] = useState("");

  const [dropLatitude, setDropLatitude] =

    useState<number | null>(null);

  const [dropLongitude, setDropLongitude] =

    useState<number | null>(null);



  // =========================================================

  // STATES

  // =========================================================



  const [gettingLocation, setGettingLocation] =

    useState(true);



  const [findingLocation, setFindingLocation] =

    useState(false);



  const [booking, setBooking] = useState(false);



  const [waitingForDriver, setWaitingForDriver] =

    useState(false);



  const [rideId, setRideId] = useState<string | null>(

    null

  );



  // =========================================================

  // FIRESTORE LISTENER

  // =========================================================



  const unsubscribeRef = useRef<(() => void) | null>(

    null

  );



  const navigatingRef = useRef(false);



  // =========================================================

  // GET CURRENT LOCATION WHEN SCREEN OPENS

  // =========================================================



  useEffect(() => {

    getCurrentLocation();



    return () => {

      stopRideListener();

    };

  }, []);



  // =========================================================

  // GET CURRENT GPS LOCATION

  // =========================================================



  const getCurrentLocation = async () => {

    try {

      setGettingLocation(true);



      console.log("Requesting location permission...");



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



      const latitude = location.coords.latitude;

      const longitude = location.coords.longitude;



      console.log("CURRENT LATITUDE:", latitude);

      console.log("CURRENT LONGITUDE:", longitude);



      setPickupLatitude(latitude);

      setPickupLongitude(longitude);



      // -------------------------------------------------------

      // Convert current GPS coordinates to address

      // -------------------------------------------------------



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

          const address = addresses[0];



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

              `${latitude.toFixed(

                6

              )}, ${longitude.toFixed(6)}`

          );

        } else {

          setPickupLocation(

            `${latitude.toFixed(

              6

            )}, ${longitude.toFixed(6)}`

          );

        }

      } catch (error) {

        console.log(

          "REVERSE GEOCODING ERROR:",

          error

        );



        // Even if address lookup fails,

        // keep the GPS coordinates.

        setPickupLocation(

          `${latitude.toFixed(

            6

          )}, ${longitude.toFixed(6)}`

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



  // =========================================================

  // FIND DROP LOCATION

  // =========================================================



  const findDropLocation = async () => {

    const searchText = dropLocation.trim();



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



      // -------------------------------------------------------

      // Use online geocoding

      // -------------------------------------------------------



      const url =

        "https://photon.komoot.io/api/?q=" +

        encodeURIComponent(searchText) +

        "&limit=5";



      console.log(

        "LOCATION SEARCH URL:",

        url

      );



      const response = await fetch(url);



      console.log(

        "LOCATION SEARCH STATUS:",

        response.status

      );



      if (!response.ok) {

        throw new Error(

          `Location search failed: ${response.status}`

        );

      }



      const data = await response.json();



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



      // -------------------------------------------------------

      // First result

      // -------------------------------------------------------



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



      const longitude = Number(

        coordinates[0]

      );



      const latitude = Number(

        coordinates[1]

      );



      console.log(

        "DROP LATITUDE:",

        latitude

      );



      console.log(

        "DROP LONGITUDE:",

        longitude

      );



      // -------------------------------------------------------

      // Save coordinates

      // -------------------------------------------------------



      setDropLatitude(latitude);

      setDropLongitude(longitude);



      // -------------------------------------------------------

      // Create readable address

      // -------------------------------------------------------



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

        setDropLocation(foundAddress);

      }



      Alert.alert(

        "Location Found",

        foundAddress ||

          searchText

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



  // =========================================================

  // BOOK RIDE

  // =========================================================
  // CALCULATE DISTANCE BETWEEN TWO GPS LOCATIONS
  // =========================================================

  const calculateDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) / 180;
    const dLon =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
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

  // =========================================================
  // FIND NEAREST AVAILABLE DRIVER
  // =========================================================

  const findNearestDriver = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      console.log(
        "🔎 Finding nearest available driver..."
      );

      const driversQuery = query(
        collection(db, "drivers"),
        where("isAvailable", "==", true)
      );

      const snapshot = await getDocs(
        driversQuery
      );

      console.log(
        "🚗 Available drivers found:",
        snapshot.size
      );

      if (snapshot.empty) {
        console.log(
          "❌ No available drivers."
        );
        return null;
      }

      let nearestDriver: any = null;
      let shortestDistance = Infinity;

      snapshot.forEach((driverDoc) => {
        const driver = driverDoc.data();

        if (
          typeof driver.latitude !== "number" ||
          typeof driver.longitude !== "number"
        ) {
          console.log(
            "⚠️ Driver has no GPS location:",
            driverDoc.id
          );
          return;
        }

        const distance = calculateDistanceKm(
          latitude,
          longitude,
          driver.latitude,
          driver.longitude
        );

        console.log(
          "🚗 Driver:",
          driverDoc.id,
          "Distance:",
          distance.toFixed(2),
          "km"
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestDriver = {
            id: driverDoc.id,
            ...driver,
            distanceKm: distance,
          };
        }
      });

      if (!nearestDriver) {
        console.log(
          "❌ No driver with valid GPS location."
        );
        return null;
      }

      console.log(
        "✅ NEAREST DRIVER:",
        nearestDriver.id
      );

      console.log(
        "📏 DISTANCE:",
        nearestDriver.distanceKm.toFixed(2),
        "km"
      );

      return nearestDriver;
    } catch (error) {
      console.error(
        "❌ FIND NEAREST DRIVER ERROR:",
        error
      );
      return null;
    }
  };

  // =========================================================
  // BOOK RIDE
  // =========================================================



  const handleBookRide = async () => {

    // -------------------------------------------------------

    // Check pickup

    // -------------------------------------------------------



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



    // -------------------------------------------------------

    // Check drop text

    // -------------------------------------------------------



    if (!dropLocation.trim()) {

      Alert.alert(

        "Drop Location",

        "Please enter your destination."

      );



      return;

    }



    // -------------------------------------------------------

    // Check whether Find was pressed

    // -------------------------------------------------------



    if (

      dropLatitude === null ||

      dropLongitude === null

    ) {

      Alert.alert(

        "Find Location",

        "Please press Find Location to find the destination before booking."

      );



      return;

    }



    // -------------------------------------------------------

    // Firebase authentication

    // -------------------------------------------------------



    const currentUser = auth.currentUser;



    if (!currentUser) {

      Alert.alert(

        "Login Required",

        "Please login again."

      );



      router.replace("/login");



      return;

    }



    try {

      setBooking(true);



      const riderId = currentUser.uid;

      const riderEmail =
        currentUser.email || "";

      // -------------------------------------------------------
      // Find nearest available driver
      // -------------------------------------------------------

      const nearestDriver =
        await findNearestDriver(
          pickupLatitude,
          pickupLongitude
        );

      console.log(
        "NEAREST DRIVER RESULT:",
        nearestDriver
      );



      console.log(

        "RIDER FIREBASE UID:",

        riderId

      );



      // -------------------------------------------------------

      // Ride document

      // -------------------------------------------------------



      const rideData = {

        riderId: riderId,



        riderEmail: riderEmail,



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



        // Assign the nearest available driver
        driverId:
          nearestDriver?.id || null,

        driverName:
          nearestDriver?.fullName || null,



        driverLatitude: null,



        driverLongitude: null,



        // Initial status

        status: "requested",



        createdAt:

          serverTimestamp(),



        acceptedAt: null,



        startedAt: null,



        completedAt: null,

      };



      console.log(

        "CREATING RIDE:",

        rideData

      );



      // -------------------------------------------------------

      // Create Firestore ride

      // -------------------------------------------------------



      const rideRef = await addDoc(

        collection(db, "rides"),

        rideData

      );



      const newRideId = rideRef.id;



      console.log(

        "RIDE CREATED:",

        newRideId

      );



     
      if (nearestDriver) {
        console.log(
          "🚕 RIDE ASSIGNED TO NEAREST DRIVER:",
          nearestDriver.id
        );

        console.log(
          "📏 DRIVER DISTANCE:",
          nearestDriver.distanceKm.toFixed(2),
          "km"
        );
      } else {
        console.log(
          "⚠️ RIDE CREATED WITHOUT DRIVER ASSIGNMENT."
        );
      }



 setRideId(newRideId);



      setWaitingForDriver(true);



      navigatingRef.current = false;



      // -------------------------------------------------------

      // Start real-time listener

      // -------------------------------------------------------



      listenToRide(newRideId);

    } catch (error) {

      console.log(

        "CREATE RIDE ERROR:",

        error

      );



      Alert.alert(

        "Booking Error",

        "Unable to create the ride. Please try again."

      );

    } finally {

      setBooking(false);

    }

  };



  // =========================================================

  // LISTEN TO FIRESTORE RIDE

  // =========================================================



  const listenToRide = (

    currentRideId: string

  ) => {

    stopRideListener();



    console.log(

      "STARTING REAL-TIME RIDE LISTENER:",

      currentRideId

    );



    const rideRef = doc(

      db,

      "rides",

      currentRideId

    );



    const unsubscribe = onSnapshot(

      rideRef,

      (snapshot) => {

        if (!snapshot.exists()) {

          console.log(

            "Ride document does not exist."

          );



          return;

        }



        const ride = snapshot.data();



        console.log(

          "REAL-TIME RIDE UPDATE:",

          ride

        );



        const status = ride.status;



        console.log(

          "CURRENT RIDE STATUS:",

          status

        );



        // =====================================================

        // DRIVER ACCEPTED

        // =====================================================



        if (

          status === "accepted" &&

          !navigatingRef.current

        ) {

          console.log(

            "DRIVER ACCEPTED RIDE"

          );



          navigatingRef.current = true;



          stopRideListener();



          setWaitingForDriver(false);



          router.push({

            pathname: "/rideprogress",

            params: {

              rideId: currentRideId,

            },

          });



          return;

        }



        // =====================================================

        // DRIVER ARRIVED

        // =====================================================



        if (

          status === "driverArrived" &&

          !navigatingRef.current

        ) {

          console.log(

            "DRIVER ARRIVED"

          );



          navigatingRef.current = true;



          stopRideListener();



          setWaitingForDriver(false);



          router.push({

            pathname: "/rideprogress",

            params: {

              rideId: currentRideId,

            },

          });



          return;

        }



        // =====================================================

        // RIDE STARTED

        // =====================================================



        if (

          status === "inProgress" &&

          !navigatingRef.current

        ) {

          console.log(

            "RIDE STARTED"

          );



          navigatingRef.current = true;



          stopRideListener();



          setWaitingForDriver(false);



          router.push({

            pathname: "/rideprogress",

            params: {

              rideId: currentRideId,

            },

          });



          return;

        }



        // =====================================================

        // RIDE CANCELLED

        // =====================================================



        if (

          status === "cancelled" ||

          status === "canceled"

        ) {

          console.log(

            "RIDE CANCELLED"

          );



          stopRideListener();



          setWaitingForDriver(false);



          Alert.alert(

            "Ride Cancelled",

            "The driver cancelled the ride."

          );



          return;

        }



        // =====================================================

        // RIDE COMPLETED

        // =====================================================



        if (status === "completed") {

          console.log(

            "RIDE COMPLETED"

          );



          stopRideListener();



          setWaitingForDriver(false);



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



  // =========================================================

  // STOP FIRESTORE LISTENER

  // =========================================================



  const stopRideListener = () => {

    if (unsubscribeRef.current) {

      unsubscribeRef.current();



      unsubscribeRef.current = null;

    }

  };



  // =========================================================

  // CANCEL WAITING

  // =========================================================



  const handleCancel = () => {

    stopRideListener();



    setWaitingForDriver(false);



    setRideId(null);



    navigatingRef.current = false;

  };



  // =========================================================

  // UI

  // =========================================================



  return (

    <View style={styles.container}>



      {/* =====================================================

          TITLE

      ===================================================== */}



      <Text style={styles.title}>

        Book a Ride

      </Text>



      {!waitingForDriver && (

        <>

          {/* =================================================

              PICKUP

          ================================================= */}



          <Text style={styles.label}>

            Pickup Location

          </Text>



          <View style={styles.locationRow}>



            <TextInput

              style={styles.locationInput}

              placeholder="Getting current location..."

              value={pickupLocation}

              onChangeText={

                setPickupLocation

              }

              editable={!gettingLocation}

            />



            {gettingLocation && (

              <ActivityIndicator

                size="small"

              />

            )}



          </View>



          <TouchableOpacity

            style={

              styles.currentLocationButton

            }

            onPress={

              getCurrentLocation

            }

            disabled={

              gettingLocation

            }

          >

            <Text

              style={

                styles.currentLocationText

              }

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

                {pickupLatitude.toFixed(

                  6

                )}

                ,{" "}

                {pickupLongitude.toFixed(

                  6

                )}

              </Text>

            )}



          {/* =================================================

              DROP LOCATION

          ================================================= */}



          <Text style={styles.label}>

            Drop Location

          </Text>



          <View style={styles.dropRow}>



            <TextInput

              style={styles.dropInput}

              placeholder="Enter destination"

              value={dropLocation}

              onChangeText={(text) => {

                setDropLocation(text);



                // Destination changed,

                // so previous coordinates are invalid.

                setDropLatitude(null);

                setDropLongitude(null);

              }}

            />



            <TouchableOpacity

              style={styles.findButton}

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



          {dropLatitude !== null &&

            dropLongitude !== null && (

              <Text

                style={styles.coordinates}

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



          {/* =================================================

              BOOK RIDE

          ================================================= */}



          <TouchableOpacity

            style={[

              styles.bookButton,

              (booking ||

                gettingLocation ||

                findingLocation) &&

                styles.disabledButton,

            ]}

            onPress={

              handleBookRide

            }

            disabled={

              booking ||

              gettingLocation ||

              findingLocation

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



      {/* =====================================================

          WAITING FOR DRIVER

      ===================================================== */}



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

            style={styles.waitingText}

          >

            Your ride has been created.

          </Text>



          <Text

            style={styles.waitingText}

          >

            Waiting for a driver to

            accept your ride...

          </Text>



          {rideId && (

            <Text style={styles.rideId}>

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



    </View>

  );

}



// ============================================================

// STYLES

// ============================================================



const styles = StyleSheet.create({

  container: {

    flex: 1,

    padding: 20,

    backgroundColor: "#fff",

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

    textAlignVertical: "center",

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