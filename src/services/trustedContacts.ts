import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export type TrustedContactInput = {
  name: string;
  phone: string;
  relationship: string;
};

function getCurrentUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in first.");
  }

  return user.uid;
}

function validateContact(input: TrustedContactInput) {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const relationship = input.relationship.trim();

  if (!name || !phone || !relationship) {
    throw new Error("Please fill in all contact details.");
  }

  if (!/^\+?[0-9\s-]{8,15}$/.test(phone)) {
    throw new Error("Please enter a valid phone number.");
  }

  return { name, phone, relationship };
}

async function verifyContactOwnership(contactId: string, userId: string) {
  if (!contactId.trim()) {
    throw new Error("Invalid contact ID.");
  }

  const contactsQuery = query(
    collection(db, "trustedContacts"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(contactsQuery);

  const belongsToUser = snapshot.docs.some(
    (document) => document.id === contactId
  );

  if (!belongsToUser) {
    throw new Error("Contact not found or access denied.");
  }
}

export async function addTrustedContact(input: TrustedContactInput) {
  const userId = getCurrentUserId();
  const contact = validateContact(input);

  const contactRef = await addDoc(
    collection(db, "trustedContacts"),
    {
      userId,
      ...contact,
      createdAt: serverTimestamp(),
    }
  );

  return contactRef.id;
}

export async function getTrustedContacts() {
  const userId = getCurrentUserId();

  const contactsQuery = query(
    collection(db, "trustedContacts"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(contactsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

export async function updateTrustedContact(
  contactId: string,
  input: TrustedContactInput
) {
  const userId = getCurrentUserId();
  const contact = validateContact(input);

  await verifyContactOwnership(contactId, userId);

  await updateDoc(doc(db, "trustedContacts", contactId), {
    ...contact,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTrustedContact(contactId: string) {
  const userId = getCurrentUserId();

  await verifyContactOwnership(contactId, userId);

  await deleteDoc(doc(db, "trustedContacts", contactId));
}
