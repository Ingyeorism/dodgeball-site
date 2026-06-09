import { initializeApp } from 'firebase/app';
import { collection, doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const configured = requiredConfigKeys.every((key) => Boolean(firebaseConfig[key]));
const app = configured ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const matchesRef = db ? collection(db, 'leagues', 'dodgeball-reunion-2026', 'matches') : null;

export function isFirebaseConfigured() {
  return configured;
}

export function subscribeToRemoteMatches(onMatches, onError) {
  if (!matchesRef) return () => {};

  return onSnapshot(
    matchesRef,
    (snapshot) => {
      const matches = snapshot.docs.map((matchDoc) => ({
        id: Number(matchDoc.id),
        ...matchDoc.data()
      }));
      onMatches(matches);
    },
    onError
  );
}

export async function saveRemoteMatch(match) {
  if (!matchesRef) return false;

  await setDoc(
    doc(matchesRef, String(match.id)),
    {
      id: match.id,
      sets: match.sets,
      status: match.status,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return true;
}
