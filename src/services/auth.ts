
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import {
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: "user",
    createdAt: serverTimestamp(),
  });

  return user;
}

export async function loginUser(
  email: string,
  password: string
) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}
