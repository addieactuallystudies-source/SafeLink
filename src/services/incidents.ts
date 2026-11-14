
import {
    addDoc,
    collection,
    getDocs,
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

export async function createIncident(input: IncidentInput) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to report an emergency.");
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

  const incidentRef = await addDoc(
    collection(db, "incidents"),
    incident
  );

  return incidentRef.id;
}

export async function getMyIncidents() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const incidentsQuery = query(
    collection(db, "incidents"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(incidentsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}
