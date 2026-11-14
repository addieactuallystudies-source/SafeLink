
import {
    doc,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export async function acceptIncident(incidentId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in as a responder first.");
  }

  const incidentRef = doc(db, "incidents", incidentId);
  const responderRef = doc(db, "responders", user.uid);

  return await runTransaction(db, async (transaction) => {
    const responderSnapshot = await transaction.get(responderRef);
    const incidentSnapshot = await transaction.get(incidentRef);

    if (!responderSnapshot.exists()) {
      throw new Error("Responder account not found.");
    }

    const responder = responderSnapshot.data();

    if (
      responder.isVerified !== true ||
      responder.isAvailable !== true
    ) {
      throw new Error("You are not an approved, available responder.");
    }

    if (!incidentSnapshot.exists()) {
      throw new Error("Incident not found.");
    }

    const incident = incidentSnapshot.data();

    if (incident.status !== "pending") {
      throw new Error("This incident has already been accepted or closed.");
    }

    transaction.update(incidentRef, {
      status: "assigned",
      responderId: user.uid,
      assignedAt: serverTimestamp(),
    });

    return {
      incidentId,
      responderId: user.uid,
      status: "assigned",
    };
  });
}
