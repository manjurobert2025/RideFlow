import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

export async function registerUser(
  fullName: string,
  email: string,
  phoneNumber: string,
  password: string
) {
  // Create Firebase Authentication account
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // Create Rider document in Firestore
  const riderRef = doc(db, "riders", user.uid);

  await setDoc(riderRef, {
    userId: user.uid,
    fullName: fullName,
    email: email,
    phoneNumber: phoneNumber,
    role: "Rider",
    createdAt: serverTimestamp(),
  });

  console.log("✅ Rider saved to Firestore:", user.uid);

  return user;
}

export async function loginUser(
  email: string,
  password: string
) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}