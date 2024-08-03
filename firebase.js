import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from "./firebase_config.mjs"

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}