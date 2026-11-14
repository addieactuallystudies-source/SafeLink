
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export type Responder = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  isVerified: boolean;
  reliabilityScore: number;
  rating: number;
};

export type NearbyResponder = Responder & {
  distanceKm: number;
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;

  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export async function getNearbyResponders(
  latitude: number,
  longitude: number
): Promise<NearbyResponder[]> {
  if (!auth.currentUser) {
    throw new Error("You must be logged in to find responders.");
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid location coordinates.");
  }

  const respondersQuery = query(
    collection(db, "responders"),
    where("isAvailable", "==", true),
    where("isVerified", "==", true)
  );

  const snapshot = await getDocs(respondersQuery);

  const responders: NearbyResponder[] = snapshot.docs
    .map((document) => {
      const data = document.data();

      return {
        id: document.id,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        isAvailable: data.isAvailable,
        isVerified: data.isVerified,
        reliabilityScore: data.reliabilityScore ?? 0,
        rating: data.rating ?? 0,
      };
    })
    .filter((responder) =>
      typeof responder.name === "string" &&
      Number.isFinite(responder.latitude) &&
      Number.isFinite(responder.longitude) &&
      Number.isFinite(responder.reliabilityScore) &&
      Number.isFinite(responder.rating)
    )
    .map((responder) => ({
      ...responder,
      distanceKm: calculateDistance(
        latitude,
        longitude,
        responder.latitude,
        responder.longitude
      ),
    }));

  // First search within 2 km.
  let nearby = responders.filter(
    (responder) => responder.distanceKm <= 2
  );

  // Expand to 5 km if nobody is found.
  if (nearby.length === 0) {
    nearby = responders.filter(
      (responder) => responder.distanceKm <= 5
    );
  }

  // Closest responders first; use reliability and rating as tie-breakers.
  nearby.sort((a, b) => {
    if (Math.abs(a.distanceKm - b.distanceKm) > 0.1) {
      return a.distanceKm - b.distanceKm;
    }

    if (b.reliabilityScore !== a.reliabilityScore) {
      return b.reliabilityScore - a.reliabilityScore;
    }

    return b.rating - a.rating;
  });

  return nearby;
}
