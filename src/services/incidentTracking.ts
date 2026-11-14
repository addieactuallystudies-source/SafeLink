import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export type GPSLocation = {
  latitude: number;
  longitude: number;
};

export type IncidentTrackingRecord = {
  userId: string;
  responderId: string | null;
  userLocation: GPSLocation;
  responderLocation: GPSLocation | null;
};

function validateLocation(location: GPSLocation) {
  if (
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    throw new Error("Invalid GPS coordinates.");
  }
}

function getUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in first.");
  }

  return user.uid;
}

// CREATE TRACKING DOCUMENT WHEN USER SUBMITS SOS
export async function createIncidentTracking(
  incidentId: string,
  location: GPSLocation
) {
  const userId = getUserId();

  validateLocation(location);

  if (!incidentId.trim()) {
    throw new Error("Invalid incident ID.");
  }

  await setDoc(doc(db, "incidentTracking", incidentId), {
    userId,
    responderId: null,
    userLocation: location,
    responderLocation: null,
    createdAt: serverTimestamp(),
  });
}

// UPDATE USER'S LIVE LOCATION
export async function updateUserLocation(
  incidentId: string,
  location: GPSLocation
) {
  getUserId();
  validateLocation(location);

  await updateDoc(doc(db, "incidentTracking", incidentId), {
    userLocation: location,
    updatedAt: serverTimestamp(),
  });
}

// RESPONDER CLAIMS TRACKING AFTER ACCEPTING SOS
export async function claimIncidentTracking(incidentId: string) {
  getUserId();

  await updateDoc(doc(db, "incidentTracking", incidentId), {
    responderId: auth.currentUser!.uid,
    updatedAt: serverTimestamp(),
  });
}

// UPDATE RESPONDER'S LIVE LOCATION
export async function updateResponderLocation(
  incidentId: string,
  location: GPSLocation
) {
  getUserId();
  validateLocation(location);

  await updateDoc(doc(db, "incidentTracking", incidentId), {
    responderLocation: location,
    updatedAt: serverTimestamp(),
  });
}

// LISTEN TO BOTH LOCATIONS IN REAL TIME
export function subscribeToIncidentTracking(
  incidentId: string,
  onUpdate: (record: IncidentTrackingRecord) => void,
  onError?: (error: Error) => void
) {
  getUserId();

  return onSnapshot(
    doc(db, "incidentTracking", incidentId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onError?.(new Error("Tracking information not found."));
        return;
      }

      onUpdate(snapshot.data() as IncidentTrackingRecord);
    },
    (error) => onError?.(error)
  );
}
