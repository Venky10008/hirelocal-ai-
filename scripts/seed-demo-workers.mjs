/**
 * Seeds demo workers into Firestore.
 * Requires .env with Firebase credentials. Run:
 *   npm run seed:workers
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env and add your Firebase credentials.`);
    process.exit(1);
  }
  return value;
}

loadEnvFile();

const firebaseConfig = {
  apiKey: requireEnv("FIREBASE_API_KEY"),
  authDomain: requireEnv("FIREBASE_AUTH_DOMAIN"),
  projectId: requireEnv("FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv("FIREBASE_APP_ID"),
};

const DEMO_WORKERS = [
  {
    name: "Ramesh Kumar",
    skill: "Electrician",
    area: "Madhapur",
    experience: 12,
    rating: 4.8,
    phone: "9876543210",
    price: "₹150/visit",
    available: true,
    verified: true,
    source: "firebase",
  },
  {
    name: "Suresh Plumbing Works",
    skill: "Plumber",
    area: "Gachibowli",
    experience: 8,
    rating: 4.6,
    phone: "9123456780",
    price: "₹200/visit",
    available: true,
    verified: true,
    source: "firebase",
  },
  {
    name: "CoolAir Services",
    skill: "AC Repair",
    area: "HITEC City",
    experience: 10,
    rating: 4.9,
    phone: "9988776655",
    price: "₹300/visit",
    available: true,
    verified: true,
    source: "firebase",
  },
  {
    name: "Rahul Carpenter",
    skill: "Carpenter",
    area: "Banjara Hills",
    experience: 6,
    rating: 4.5,
    phone: "9012345678",
    price: "₹250/visit",
    available: true,
    verified: true,
    source: "firebase",
  },
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  for (const worker of DEMO_WORKERS) {
    const existing = await getDocs(
      query(
        collection(db, "workers"),
        where("name", "==", worker.name),
        where("phone", "==", worker.phone),
      ),
    );
    if (!existing.empty) {
      console.log(`Skip (exists): ${worker.name}`);
      continue;
    }
    const ref = await addDoc(collection(db, "workers"), worker);
    console.log(`Added: ${worker.name} (${ref.id})`);
  }
  console.log("Demo workers seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
