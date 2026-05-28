import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "@/integrations/firebase/config.server";
import type { Worker } from "@/data/workers";
import { categoryToSkillSlug } from "@/lib/workers.shared";

export type FirestoreWorker = {
  name: string;
  skill: string;
  area: string;
  experience: number;
  rating: number;
  phone: string;
  price: string;
  available: boolean;
  verified: boolean;
  source: "firebase";
  registeredAt?: Timestamp;
};

function toUiWorker(id: string, data: FirestoreWorker): Worker {
  const phone = data.phone.replace(/\D/g, "");
  return {
    id,
    name: data.name,
    skill: data.skill,
    skillSlug: categoryToSkillSlug(data.skill),
    area: data.area,
    city: "Hyderabad",
    rating: data.rating ?? 0,
    experienceYears: Number(data.experience) || 0,
    price: data.price || "Contact for price",
    jobsDone: 0,
    availability: data.available ? "available" : "tomorrow",
    services: [{ name: "Service visit", price: data.price || "Contact for price" }],
    reviews: data.verified ? [{ tag: "HireLocal Verified", count: 1 }] : [],
    schedule: "Monday – Saturday | 8:00 AM – 8:00 PM",
    phone: phone.length === 10 ? `91${phone}` : phone,
  };
}

function sortWorkers(workers: (FirestoreWorker & { id: string })[]) {
  return [...workers].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

async function queryAvailableWorkers(
  skill: string,
  area?: string,
): Promise<(FirestoreWorker & { id: string })[]> {
  const db = getFirestoreDb();
  const base = [where("skill", "==", skill), where("available", "==", true)] as const;

  try {
    const q = area
      ? query(collection(db, "workers"), ...base, where("area", "==", area))
      : query(collection(db, "workers"), ...base);
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as FirestoreWorker) }));
  } catch (indexErr) {
    console.warn("[Firebase] composite query failed, falling back:", indexErr);
    const snap = await getDocs(query(collection(db, "workers"), where("available", "==", true)));
    return snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as FirestoreWorker) }))
      .filter((w) => w.skill === skill && (!area || w.area === area));
  }
}

export async function searchWorkersFromFirestore(category: string, area: string): Promise<Worker[]> {
  try {
    const skill = category.trim();
    const areaTrimmed = area.trim();
    const rows = await queryAvailableWorkers(skill, areaTrimmed || undefined);
    console.log("[Firebase] searchWorkers:", { skill, area: areaTrimmed, count: rows.length, rows });
    return sortWorkers(rows).map((w) => toUiWorker(w.id, w));
  } catch (err) {
    console.error("[Firebase] searchWorkers error:", err);
    throw new Error("Unable to load workers right now.");
  }
}

export async function listAllWorkersFromFirestore(): Promise<Worker[]> {
  const db = getFirestoreDb();
  const snap = await getDocs(query(collection(db, "workers"), where("available", "==", true)));
  const rows = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as FirestoreWorker),
  }));
  console.log("[Firebase] listAllWorkers:", rows.length);
  return sortWorkers(rows).map((w) => toUiWorker(w.id, w));
}

export async function getWorkerByIdFromFirestore(id: string): Promise<Worker | null> {
  try {
    const all = await listAllWorkersFromFirestore();
    return all.find((w) => w.id === id) ?? null;
  } catch (err) {
    console.error("[Firebase] getWorkerById error:", err);
    return null;
  }
}

export async function saveWorkerToFirestore(data: {
  name: string;
  skill: string;
  area: string;
  experience: number;
  phone: string;
}): Promise<{ id: string }> {
  try {
    const db = getFirestoreDb();
    const docRef = await addDoc(collection(db, "workers"), {
      name: data.name,
      skill: data.skill,
      area: data.area,
      experience: data.experience,
      phone: data.phone,
      rating: 0,
      price: "Contact for price",
      available: true,
      verified: true,
      source: "firebase",
      registeredAt: serverTimestamp(),
    });
    console.log("[Firebase] saveWorker:", docRef.id, data);
    return { id: docRef.id };
  } catch (err) {
    console.error("[Firebase] saveWorker error:", err);
    throw new Error("Unable to save profile right now.");
  }
}
