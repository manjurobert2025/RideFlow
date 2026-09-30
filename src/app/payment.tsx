import { useLocalSearchParams, useRouter } from "expo-router";

import { useEffect, useState } from "react";



import {
  Alert,

  SafeAreaView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from "react-native";



import {
  doc,

  getDoc,

  serverTimestamp,

  updateDoc,
} from "firebase/firestore";



import {
  getAuth,

  signOut,
} from "firebase/auth";



import { db } from "../../services/firebase";



// ==================================================

// RAZORPAY WEB CHECKOUT TYPES

// ==================================================



declare global {

  interface Window {

    Razorpay?: any;

  }

}



// ==================================================

// LOAD RAZORPAY CHECKOUT.JS

// ==================================================



const loadRazorpayScript = (): Promise<void> => {

  return new Promise((resolve, reject) => {

    if (typeof window === "undefined") {

      reject(

        new Error(

          "Razorpay Web Checkout is available only in the web app."

        )

      );

      return;

    }



    if (window.Razorpay) {

      resolve();

      return;

    }



    const existingScript = document.querySelector(

      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'

    );



    if (existingScript) {

      existingScript.addEventListener("load", () => resolve());



      existingScript.addEventListener("error", () =>

        reject(

          new Error(

            "Unable to load Razorpay Checkout."

          )

        )

      );



      return;

    }



    const script = document.createElement("script");



    script.src =

      "https://checkout.razorpay.com/v1/checkout.js";



    script.async = true;



    script.onload = () => resolve();



    script.onerror = () =>

      reject(

        new Error(

          "Unable to load Razorpay Checkout."

        )

      );



    document.body.appendChild(script);

  });

};



// ==================================================

// CLOUDFLARE WORKER URL

// ==================================================



const CLOUDFLARE_WORKER_URL =

  "https://odd-art-cad0.manjurobert.workers.dev";



// ==================================================

// PAYMENT SCREEN

// ==================================================



export default function Payment() {

  const router = useRouter();



  const { rideId, amount } =

    useLocalSearchParams<{

      rideId?: string;

      amount?: string;

    }>();



  const [loading, setLoading] =

    useState(false);



  // ==================================================

  // CHECK IF PAYMENT IS ALREADY COMPLETED

  // ==================================================



  useEffect(() => {

    const checkExistingPayment = async () => {

      try {

        if (!rideId) {

          return;

        }



        console.log(

          "Checking existing payment status..."

        );



        const rideRef = doc(

          db,

          "rides",

          rideId

        );



        const rideSnapshot =

          await getDoc(rideRef);



        if (!rideSnapshot.exists()) {

          console.log(

            "Ride does not exist."

          );

          return;

        }



        const rideData =

          rideSnapshot.data();



        console.log(

          "Existing ride data:",

          rideData

        );



        // ==================================================

        // PAYMENT ALREADY COMPLETED

        // ==================================================



        if (

          rideData.paymentStatus === "paid"

        ) {

          console.log(

            "Payment already completed."

          );



          console.log(

            "Logging rider out..."

          );



          const auth = getAuth();



          try {

            await signOut(auth);



            console.log(

              "Rider logged out successfully."

            );

          } catch (logoutError) {

            console.log(

              "Logout error:",

              logoutError

            );

          }



          // ==================================================

          // GO TO LOGIN PAGE

          // ==================================================



          router.replace("/auth/login");



          return;

        }



        console.log(

          "Payment is not completed."

        );

      } catch (error) {

        console.log(

          "Payment status check error:",

          error

        );

      }

    };



    checkExistingPayment();

  }, [rideId]);



  // ==================================================

  // LOAD RAZORPAY CHECKOUT.JS

  // ==================================================



  useEffect(() => {

    if (typeof window !== "undefined") {

      loadRazorpayScript().catch((error) => {

        console.log(

          "Razorpay script load error:",

          error?.message

        );

      });

    }

  }, []);



  // ==================================================

  // RIDE FARE
  // ==================================================

  const [rideAmount, setRideAmount] =
    useState<number | null>(null);

  const [loadingRideAmount, setLoadingRideAmount] =
    useState(true);

  // ==================================================
  // LOAD RIDE FARE FROM FIRESTORE
  // ==================================================

  useEffect(() => {
    const loadRideFare = async () => {
      if (!rideId) {
        setLoadingRideAmount(false);
        return;
      }

      try {
        setLoadingRideAmount(true);

        console.log(
          "Loading ride fare from Firestore..."
        );

        const rideRef = doc(
          db,
          "rides",
          rideId
        );

        const rideSnapshot =
          await getDoc(rideRef);

        if (!rideSnapshot.exists()) {
          console.log(
            "Ride not found while loading fare."
          );

          setRideAmount(null);
          return;
        }

        const rideData =
          rideSnapshot.data();

        console.log(
          "RIDE FARE DATA:",
          {
            estimatedFare:
              rideData.estimatedFare,
            fare:
              rideData.fare,
            amount:
              rideData.amount,
          }
        );

        const fareValue =
          rideData.estimatedFare ??
          rideData.fare ??
          rideData.amount;

        const numericFare =
          Number(fareValue);

        if (
          !Number.isFinite(numericFare) ||
          numericFare <= 0
        ) {
          console.log(
            "Invalid fare stored for ride:",
            fareValue
          );

          setRideAmount(null);
          return;
        }

        console.log(
          "PAYMENT RIDE FARE:",
          numericFare
        );

        setRideAmount(numericFare);

      } catch (error) {
        console.error(
          "ERROR LOADING RIDE FARE:",
          error
        );

        setRideAmount(null);

      } finally {
        setLoadingRideAmount(false);
      }
    };

    loadRideFare();
  }, [rideId]);

  const displayAmount =
    rideAmount !== null
      ? rideAmount.toFixed(2)
      : "--";

  // PAY NOW

  // ==================================================



  const handlePayNow = async () => {

    try {

      // ==================================================

      // CHECK RIDE ID

      // ==================================================



      if (!rideId) {

        Alert.alert(

          "Error",

          "Ride ID is missing."

        );



        return;

      }



      // ==================================================

      // CHECK WHETHER PAYMENT IS ALREADY COMPLETED

      // ==================================================



      console.log(

        "Checking payment status before payment..."

      );



      const existingRideRef = doc(

        db,

        "rides",

        rideId

      );



      const existingRideSnapshot =

        await getDoc(existingRideRef);



      if (existingRideSnapshot.exists()) {

        const existingRideData =

          existingRideSnapshot.data();



        if (

          existingRideData.paymentStatus ===

          "paid"

        ) {

          console.log(

            "Payment is already completed."

          );



          const auth = getAuth();



          try {

            await signOut(auth);

          } catch (logoutError) {

            console.log(

              "Logout error:",

              logoutError

            );

          }



          router.replace("/auth/login");



          return;

        }

      }



      // ==================================================

      // LOAD AUTHORITATIVE RIDE FARE
      // ==================================================

      const paymentRideRef = doc(
        db,
        "rides",
        rideId
      );

      const paymentRideSnapshot =
        await getDoc(paymentRideRef);

      if (!paymentRideSnapshot.exists()) {
        Alert.alert(
          "Payment Error",
          "Ride could not be found."
        );

        return;
      }

      const paymentRideData =
        paymentRideSnapshot.data();

      const fareValue =
        paymentRideData.estimatedFare ??
        paymentRideData.fare ??
        paymentRideData.amount;

      const numericAmount =
        Number(fareValue);

      console.log(
        "AUTHORITATIVE PAYMENT FARE:",
        numericAmount
      );

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        Alert.alert(
          "Payment Error",
          "A valid fare was not found for this ride."
        );

        return;
      }

      setRideAmount(numericAmount);

      setLoading(true);



      console.log(

        "================================="

      );



      console.log(

        "PAYMENT STARTED"

      );



      console.log(

        "Ride ID:",

        rideId

      );



      console.log(

        "Ride Amount:",

        numericAmount

      );



      console.log(

        "================================="

      );



      // ==================================================

      // 1. CREATE RAZORPAY ORDER

      // ==================================================



      console.log(

        "Creating Razorpay order..."

      );



      const orderResponse =

        await fetch(

          `${CLOUDFLARE_WORKER_URL}/create-order`,

          {

            method: "POST",



            headers: {

              "Content-Type":

                "application/json",

            },



            body: JSON.stringify({

              amount:

                numericAmount,



              receipt:

                `ride_${rideId}`,

            }),

          }

        );



      console.log(

        "Create order HTTP status:",

        orderResponse.status

      );



      const orderText =

        await orderResponse.text();



      console.log(

        "Create order response:",

        orderText

      );



      let orderData: any;



      try {

        orderData =

          JSON.parse(orderText);

      } catch {

        throw new Error(

          "Invalid response from payment server."

        );

      }



      // ==================================================

      // CHECK HTTP RESPONSE

      // ==================================================



      if (!orderResponse.ok) {

        throw new Error(

          orderData?.message ||

            "Unable to create payment order."

        );

      }



      // ==================================================

      // CHECK SUCCESS

      // ==================================================



      if (

        !orderData ||

        !orderData.success

      ) {

        throw new Error(

          orderData?.message ||

            "Razorpay order was not created."

        );

      }



      // ==================================================

      // CHECK ORDER ID

      // ==================================================



      if (!orderData.orderId) {

        throw new Error(

          "Razorpay order ID was not returned by the server."

        );

      }



      // ==================================================

      // CHECK KEY ID

      // ==================================================



      if (!orderData.keyId) {

        throw new Error(

          "Razorpay Key ID was not returned by the server."

        );

      }



      console.log(

        "Razorpay Order ID:",

        orderData.orderId

      );



      console.log(

        "Razorpay Amount:",

        orderData.amount

      );



      console.log(

        "Razorpay Currency:",

        orderData.currency

      );



      // ==================================================

      // 2. OPEN RAZORPAY CHECKOUT

      // ==================================================



      console.log(

        "Opening Razorpay Checkout..."

      );



      const options = {

        key:

          orderData.keyId,



        amount:

          orderData.amount,



        currency:

          orderData.currency ||

          "INR",



        name:

          "Ride App",



        description:

          "Ride Payment",



        order_id:

          orderData.orderId,



        prefill: {},



        theme: {

          color:

            "#2563EB",

        },

      };



      console.log(

        "Razorpay checkout options prepared."

      );



      // ==================================================

      // OPEN RAZORPAY WEB CHECKOUT

      // ==================================================



      await loadRazorpayScript();



      if (

        typeof window === "undefined" ||

        !window.Razorpay

      ) {

        throw new Error(

          "Razorpay Checkout could not be loaded."

        );

      }



      const paymentData: any =

        await new Promise(

          (

            resolve,

            reject

          ) => {

            try {

              const razorpay =

                new window.Razorpay({

                  ...options,



                  handler:

                    (

                      response: any

                    ) => {

                      resolve(

                        response

                      );

                    },

                });



              razorpay.on(

                "payment.failed",

                (

                  response: any

                ) => {

                  const description =

                    response?.error

                      ?.description ||

                    "Razorpay payment failed.";



                  reject(

                    new Error(

                      description

                    )

                  );

                }

              );



              razorpay.open();

            } catch (

              error

            ) {

              reject(error);

            }

          }

        );



      console.log(

        "================================="

      );



      console.log(

        "RAZORPAY PAYMENT SUCCESS"

      );



      console.log(

        "Payment response:",

        paymentData

      );



      console.log(

        "================================="

      );



      // ==================================================

      // 3. CHECK RAZORPAY RESPONSE

      // ==================================================



      if (

        !paymentData ||

        !paymentData.razorpay_payment_id

      ) {

        throw new Error(

          "Razorpay payment ID was not returned."

        );

      }



      if (

        !paymentData.razorpay_order_id

      ) {

        throw new Error(

          "Razorpay order ID was not returned."

        );

      }



      if (

        !paymentData.razorpay_signature

      ) {

        throw new Error(

          "Razorpay payment signature was not returned."

        );

      }



      // ==================================================

      // 4. VERIFY PAYMENT WITH CLOUDFLARE

      // ==================================================



      console.log(

        "================================="

      );



      console.log(

        "VERIFYING PAYMENT"

      );



      console.log(

        "================================="

      );



      const verifyResponse =

        await fetch(

          `${CLOUDFLARE_WORKER_URL}/verify-payment`,

          {

            method: "POST",



            headers: {

              "Content-Type":

                "application/json",

            },



            body: JSON.stringify({

              razorpayOrderId:

                paymentData.razorpay_order_id,



              razorpayPaymentId:

                paymentData.razorpay_payment_id,



              razorpaySignature:

                paymentData.razorpay_signature,



              expectedAmount:

                numericAmount,

            }),

          }

        );



      console.log(

        "Verify HTTP status:",

        verifyResponse.status

      );



      const verifyText =

        await verifyResponse.text();



      console.log(

        "Verify response:",

        verifyText

      );



      let verifyData: any;



      try {

        verifyData =

          JSON.parse(verifyText);

      } catch {

        throw new Error(

          "Invalid verification response from payment server."

        );

      }



      // ==================================================

      // CHECK HTTP RESPONSE

      // ==================================================



      if (!verifyResponse.ok) {

        throw new Error(

          verifyData?.message ||

            "Payment verification failed."

        );

      }



      // ==================================================

      // CHECK VERIFICATION RESULT

      // ==================================================



      if (

        !verifyData ||

        !verifyData.success ||

        !verifyData.verified

      ) {

        throw new Error(

          verifyData?.message ||

            "Payment could not be verified."

        );

      }



      console.log(

        "================================="

      );



      console.log(

        "PAYMENT VERIFIED SUCCESSFULLY"

      );



      console.log(

        "Razorpay Payment ID:",

        paymentData.razorpay_payment_id

      );



      console.log(

        "Razorpay Order ID:",

        paymentData.razorpay_order_id

      );



      console.log(

        "================================="

      );



      // ==================================================

      // 5. UPDATE FIRESTORE RIDE

      // ==================================================



      console.log(

        "Updating Firestore ride..."

      );



      const rideRef = doc(

        db,

        "rides",

        rideId

      );



      await updateDoc(

        rideRef,

        {

          paymentStatus:

            "paid",



          paymentId:

            paymentData.razorpay_payment_id,



          razorpayOrderId:

            paymentData.razorpay_order_id,



          razorpayPaymentId:

            paymentData.razorpay_payment_id,



          paymentVerifiedAt:

            serverTimestamp(),

        }

      );



      console.log(

        "Firestore ride updated successfully."

      );



      // ==================================================

      // 6. PAYMENT COMPLETED

      // LOG RIDER OUT

      // GO TO LOGIN PAGE

      // ==================================================



      console.log(

        "Payment completed successfully."

      );



      console.log(

        "Logging rider out..."

      );



      const auth = getAuth();



      await signOut(auth);



      console.log(

        "Rider logged out successfully."

      );



      // ==================================================

      // 7. SHOW LOGIN PAGE

      // ==================================================



      router.replace(

        "/auth/login"

      );



    } catch (error: any) {

      const errorMessage =

        error?.description ||

        error?.message ||

        "Payment was cancelled or failed.";



      console.log(

        "PAYMENT ERROR:",

        errorMessage

      );



      Alert.alert(

        "Payment Failed",

        errorMessage

      );

    } finally {

      setLoading(false);

    }

  };



  // ==================================================

  // UI

  // ==================================================



  return (

    <SafeAreaView

      style={styles.container}

    >



      {/* HEADER */}



      <View

        style={styles.header}

      >

        <Text

          style={styles.headerTitle}

        >

          Payment

        </Text>

      </View>



      <View

        style={styles.content}

      >



        {/* AMOUNT CARD */}



        <View

          style={styles.amountCard}

        >

          <Text

            style={styles.amountLabel}

          >

            Ride Fare

          </Text>



          <Text

            style={styles.amount}

          >

            {rideAmount !== null ? `₹${rideAmount.toFixed(2)}` : "--"}

          </Text>



          <Text

            style={styles.amountDescription}

          >

            Amount payable for your

            completed ride

          </Text>

        </View>



        {/* RIDE DETAILS */}



        <View

          style={styles.card}

        >

          <Text

            style={styles.sectionTitle}

          >

            Ride Details

          </Text>



          <View

            style={styles.infoRow}

          >

            <Text

              style={styles.label}

            >

              Ride ID

            </Text>



            <Text

              style={styles.value}

            >

              {rideId ||

                "Not available"}

            </Text>

          </View>



          <View

            style={styles.infoRow}

          >

            <Text

              style={styles.label}

            >

              Ride Fare

            </Text>



            <Text

              style={styles.value}

            >

              {rideAmount !== null ? `₹${rideAmount.toFixed(2)}` : "--"}

            </Text>

          </View>



          <View

            style={styles.infoRow}

          >

            <Text

              style={styles.label}

            >

              Currency

            </Text>



            <Text

              style={styles.value}

            >

              INR

            </Text>

          </View>

        </View>



        {/* PAYMENT METHOD */}



        <View

          style={styles.card}

        >

          <Text

            style={styles.sectionTitle}

          >

            Payment Method

          </Text>



          <View

            style={styles.paymentMethod}

          >



            <View

              style={styles.paymentIcon}

            >

              <Text

                style={

                  styles.paymentIconText

                }

              >

                ₹

              </Text>

            </View>



            <View

              style={styles.paymentInfo}

            >

              <Text

                style={styles.paymentTitle}

              >

                Online Payment

              </Text>



              <Text

                style={

                  styles.paymentDescription

                }

              >

                Secure payment through

                Razorpay

              </Text>

            </View>



            <View

              style={styles.selected}

            >

              <Text

                style={styles.selectedText}

              >

                ✓

              </Text>

            </View>



          </View>

        </View>



        {/* SECURITY */}



        <View

          style={styles.securityCard}

        >

          <Text

            style={styles.lock}

          >

            🔒

          </Text>



          <Text

            style={styles.securityText}

          >

            Your payment is securely

            processed. We do not store

            your card details.

          </Text>

        </View>



      </View>



      {/* PAY BUTTON */}



      <View

        style={styles.bottomContainer}

      >

        <TouchableOpacity

          style={[

            styles.payButton,

            loading &&

              styles.disabledButton,

          ]}

          onPress={

            handlePayNow

          }

          disabled={
            loading ||
            loadingRideAmount ||
            rideAmount === null
          }

          activeOpacity={0.8}

        >

          <Text

            style={

              styles.payButtonText

            }

          >

            {loading

              ? "Processing..."

              : loadingRideAmount
              ? "Loading fare..."
              : rideAmount === null
              ? "Fare unavailable"
              : `Pay ₹${rideAmount.toFixed(2)}`}

          </Text>

        </TouchableOpacity>

      </View>



    </SafeAreaView>

  );

}



// ==================================================

// STYLES

// ==================================================



const styles =

  StyleSheet.create({



    container: {

      flex: 1,

      backgroundColor:

        "#F7F8FA",

    },



    header: {

      backgroundColor:

        "#FFFFFF",



      paddingHorizontal:

        20,



      paddingVertical:

        18,



      borderBottomWidth:

        1,



      borderBottomColor:

        "#E5E7EB",

    },



    headerTitle: {

      fontSize: 22,

      fontWeight: "700",

      color: "#111827",

    },



    content: {

      flex: 1,

      padding: 20,

    },



    amountCard: {

      backgroundColor:

        "#2563EB",



      borderRadius:

        18,



      padding: 28,



      alignItems:

        "center",

    },



    amountLabel: {

      color:

        "#DBEAFE",



      fontSize: 15,

    },



    amount: {

      color:

        "#FFFFFF",



      fontSize: 40,



      fontWeight:

        "800",



      marginTop: 8,

    },



    amountDescription: {

      color:

        "#DBEAFE",



      fontSize: 13,



      marginTop: 8,



      textAlign:

        "center",

    },



    card: {

      backgroundColor:

        "#FFFFFF",



      borderRadius:

        16,



      padding: 20,



      marginTop: 18,

    },



    sectionTitle: {

      fontSize: 18,



      fontWeight:

        "700",



      color:

        "#111827",



      marginBottom:

        16,

    },



    infoRow: {

      flexDirection:

        "row",



      justifyContent:

        "space-between",



      paddingVertical:

        11,



      borderBottomWidth:

        1,



      borderBottomColor:

        "#F0F0F0",

    },



    label: {

      fontSize: 14,

      color: "#6B7280",

    },



    value: {

      fontSize: 14,



      color:

        "#111827",



      fontWeight:

        "600",



      maxWidth:

        "60%",



      textAlign:

        "right",

    },



    paymentMethod: {

      flexDirection:

        "row",



      alignItems:

        "center",

    },



    paymentIcon: {

      width: 48,



      height: 48,



      borderRadius: 24,



      backgroundColor:

        "#EFF6FF",



      justifyContent:

        "center",



      alignItems:

        "center",

    },



    paymentIconText: {

      fontSize: 22,



      fontWeight:

        "700",



      color:

        "#2563EB",

    },



    paymentInfo: {

      flex: 1,



      marginLeft: 14,

    },



    paymentTitle: {

      fontSize: 16,



      fontWeight:

        "700",



      color:

        "#111827",

    },



    paymentDescription: {

      fontSize: 12,



      color:

        "#6B7280",



      marginTop: 3,

    },



    selected: {

      width: 25,



      height: 25,



      borderRadius: 13,



      backgroundColor:

        "#2563EB",



      justifyContent:

        "center",



      alignItems:

        "center",

    },



    selectedText: {

      color:

        "#FFFFFF",



      fontSize: 15,



      fontWeight:

        "700",

    },



    securityCard: {

      marginTop: 18,



      padding: 15,



      backgroundColor:

        "#ECFDF5",



      borderRadius: 14,



      flexDirection:

        "row",



      alignItems:

        "center",

    },



    lock: {

      fontSize: 20,



      marginRight: 10,

    },



    securityText: {

      flex: 1,



      fontSize: 12,



      color:

        "#065F46",



      lineHeight: 18,

    },



    bottomContainer: {

      backgroundColor:

        "#FFFFFF",



      padding: 20,



      borderTopWidth:

        1,



      borderTopColor:

        "#E5E7EB",

    },



    payButton: {

      height: 54,



      borderRadius: 12,



      backgroundColor:

        "#2563EB",



      justifyContent:

        "center",



      alignItems:

        "center",

    },



    disabledButton: {

      opacity: 0.6,

    },



    payButtonText: {

      color:

        "#FFFFFF",



      fontSize: 17,



      fontWeight:

        "700",

    },



  });