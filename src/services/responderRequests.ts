import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { claimIncidentTracking } from "./incidentTracking";

export async function acceptIncident(incidentId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in as a responder first.");
  }

  if (!incidentId || !incidentId.trim()) {
    throw new Error("Invalid incident ID.");
  }

  const incidentRef = doc(db, "incidents", incidentId);
  const responderRef = doc(db, "responders", user.uid);

  const result = await runTransaction(db, async (transaction) => {
    // Firestore transactions require all reads before any writes.
    const responderSnapshot = await transaction.get(responderRef);
    const incidentSnapshot = await transaction.get(incidentRef);

    if (!responderSnapshot.exists()) {
      throw new Error("Responder account not found.");
    }

    if (!incidentSnapshot.exists()) {
      throw new Error("Incident not found.");
    }

    const responder = responderSnapshot.data();
    const incident = incidentSnapshot.data();

    if (responder.isVerified !== true) {
      throw new Error("Your responder account is not verified.");
    }

    if (responder.isAvailable !== true) {
      throw new Error("You are currently unavailable.");
    }

    if (incident.status !== "pending") {
      throw new Error("This incident has already been accepted or closed.");
    }

    transaction.update(incidentRef, {
      status: "assigned",
      responderId: user.uid,
      assignedAt: serverTimestamp(),
    });

    transaction.update(responderRef, {
      isAvailable: false,
    });

    return {
      incidentId,
      responderId: user.uid,
      status: "assigned" as const,
    };
  });

  // Claim the matching tracking document after successful acceptance.
  await claimIncidentTracking(incidentId);

  return result;
}

export async function resolveIncident(incidentId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in as a responder first.");
  }

  if (!incidentId || !incidentId.trim()) {
    throw new Error("Invalid incident ID.");
  }

  const incidentRef = doc(db, "incidents", incidentId);
  const responderRef = doc(db, "responders", user.uid);

  return runTransaction(db, async (transaction) => {
    // Firestore transactions require all reads before any writes.
    const incidentSnapshot = await transaction.get(incidentRef);
    const responderSnapshot = await transaction.get(responderRef);

    if (!incidentSnapshot.exists()) {
      throw new Error("Incident not found.");
    }

    if (!responderSnapshot.exists()) {
      throw new Error("Responder account not found.");
    }

    const incident = incidentSnapshot.data();

    if (incident.responderId !== user.uid) {
      throw new Error("You are not assigned to this incident.");
    }

    if (incident.status !== "assigned") {
      throw new Error("This incident is not currently assigned.");
    }

    transaction.update(incidentRef, {
      status: "resolved",
      resolvedAt: serverTimestamp(),
    });

    transaction.update(responderRef, {
      isAvailable: true,
    });

    return {
      incidentId,
      responderId: user.uid,
      status: "resolved" as const,
    };
  });
}
