import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getFirebaseConfig() {
  return {
    apiKey: requireEnv("FIREBASE_API_KEY"),
    authDomain: requireEnv("FIREBASE_AUTH_DOMAIN"),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: requireEnv("FIREBASE_PROJECT_ID"),
    storageBucket: requireEnv("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnv("FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnv("FIREBASE_APP_ID"),
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };
}

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export function getFirestoreDb(): Firestore {
  if (!db) {
    app = getApps().length ? getApps()[0]! : initializeApp(getFirebaseConfig());
    db = getFirestore(app);
  }
  return db;
}
