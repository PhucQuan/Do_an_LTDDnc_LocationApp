import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2dkKwqhqR37HfMRYP6RUn8fwkE574kE0",
  authDomain: "bump-b0d38.firebaseapp.com",
  projectId: "bump-b0d38",
  storageBucket: "bump-b0d38.appspot.com",
  messagingSenderId: "797969340489",
  appId: "1:797969340489:android:f742cd77a6345195ccc798", //ID của ứng dụng Android
  databaseURL: "https://bump-b0d38.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };
