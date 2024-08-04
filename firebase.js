import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBoBm8q232wy3wsY2hjGxzDwM6X38QSI5o",
  authDomain: "pantry-tracker-eadad.firebaseapp.com",
  projectId: "pantry-tracker-eadad",
  storageBucket: "pantry-tracker-eadad.appspot.com",
  messagingSenderId: "17059730680",
  appId: "1:17059730680:web:ce5b7840f9eea9c4d9970d",
  measurementId: "G-SV7YHVTK18"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}
