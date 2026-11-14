
import {
    addDoc,
    collection,
    DocumentData,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export type IncidentInput = {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type IncidentRecord = DocumentData & {
  id: string;
};

const incidentsCollection = collection(db, "incidents");

// CREATE A NEW SOS
export async function createIncident(input: IncidentInput) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to report an emergency.");
  }

  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new Error("Invalid location coordinates.");
  }

  const incident = {
    userId: user.uid,
    category: input.category,
    description: input.description,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
    status: "pending",
    createdAt: serverTimestamp(),
  };

  const incidentRef = await addDoc(incidentsCollection, incident);

  return incidentRef.id;
}

// GET ALL INCIDENTS BELONGING TO THE LOGGED-IN USER
export async function getMyIncidents() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const incidentsQuery = query(
    incidentsCollection,
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(incidentsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

// REAL-TIME UPDATES FOR THE USER
export function subscribeToMyIncidents(
  onUpdate: (incidents: IncidentRecord[]) => void,
  onError?: (error: Error) => void
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const incidentsQuery = query(
    incidentsCollection,
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    incidentsQuery,
    (snapshot) => {
      const incidents = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      onUpdate(incidents);
    },
    (error) => {
      onError?.(error);
    }
  );
}

// REAL-TIME PENDING SOS REQUESTS FOR RESPONDERS
export function subscribeToPendingIncidents(
  onUpdate: (incidents: IncidentRecord[]) => void,
  onError?: (error: Error) => void
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in as a responder first.");
  }

  const pendingQuery = query(
    incidentsCollection,
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    pendingQuery,
    (snapshot) => {
      const incidents = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      onUpdate(incidents);
    },
    (error) => {
      onError?.(error);
    }
  );
}

// REAL-TIME UPDATES FOR INCIDENTS ASSIGNED TO THE LOGGED-IN RESPONDER
export function subscribeToMyAssignedIncidents(
  onUpdate: (incidents: IncidentRecord[]) => void,
  onError?: (error: Error) => void
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in as a responder first.");
  }

  const assignedQuery = query(
    incidentsCollection,
    where("responderId", "==", user.uid),
    where("status", "==", "assigned")
  );

  return onSnapshot(
    assignedQuery,
    (snapshot) => {
      const incidents = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      onUpdate(incidents);
    },
    (error) => {
      onError?.(error);
    }
  );
}
