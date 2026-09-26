import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoiVZ5xF-nD0QH5iQ-x4deoNfbKkeCQGU",
  authDomain: "aviance-fleet-manager-app.firebaseapp.com",
  projectId: "aviance-fleet-manager-app",
  storageBucket: "aviance-fleet-manager-app.firebasestorage.app",
  messagingSenderId: "228251087475",
  appId: "1:228251087475:web:8f5f41108833b8eba6b006",
  measurementId: "G-YV1TXGZHP6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
