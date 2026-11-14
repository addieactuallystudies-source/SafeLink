
import {
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export async function loginResponder(
  email: string,
  password: string
) {
  const credentials = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const responderRef = doc(
    db,
    "responders",
    credentials.user.uid
  );

  const responderSnapshot = await getDoc(responderRef);

  if (
    !responderSnapshot.exists() ||
    responderSnapshot.data().isVerified !== true
  ) {
    await signOut(auth);

    throw new Error(
      "This account is not an approved SafeLink responder."
    );
  }

  return {
    user: credentials.user,
    responder: {
      id: responderSnapshot.id,
      ...responderSnapshot.data(),
    },
  };
}

export async function logoutResponder() {
  await signOut(auth);
}
