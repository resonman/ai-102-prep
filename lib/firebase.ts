import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyBmXSqHSTqO5R1AnykdDey8Jid45hpnIhw",
	authDomain: "ai-102-test.firebaseapp.com",
	projectId: "ai-102-test",
	storageBucket: "ai-102-test.firebasestorage.app",
	messagingSenderId: "56437133490",
	appId: "1:56437133490:web:f7ba1583df822df075f9ab",
	measurementId: "G-E4QNGLQGLL",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
