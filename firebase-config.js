// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvkP9L7p-DDsxpgv2nJlIcagUHcK3_kIs",
  authDomain: "patitas-felices-vet.firebaseapp.com",
  projectId: "patitas-felices-vet",
  storageBucket: "patitas-felices-vet.firebasestorage.app",
  messagingSenderId: "280859909152",
  appId: "1:280859909152:web:e5d2ba0670c2d299f93045"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);