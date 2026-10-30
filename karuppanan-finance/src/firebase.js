import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANKtaDjsj51xM4ztMsW7UbgmLSaqcrs3w",
  authDomain: "karuppanan-finance.firebaseapp.com",
  projectId: "karuppanan-finance",
  storageBucket: "karuppanan-finance.firebasestorage.app",
  messagingSenderId: "613299523290",
  appId: "1:613299523290:web:47fd60047e2dfa60ad1fe3",
  measurementId: "G-360EP2LNP8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();