import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

// Baca .env secara manual karena ini skrip mandiri
const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  try {
    const snap = await getDoc(doc(db, "settings", "recruitment"));
    if (snap.exists()) {
      console.log("DATA_FOUND:", JSON.stringify(snap.data()));
    } else {
      console.log("DATA_NOT_FOUND");
    }
  } catch (err) {
    console.error("ERROR_FETCH:", err.message);
  }
  process.exit(0);
}

checkData();
