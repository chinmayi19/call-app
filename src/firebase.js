import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBi6yBaQUAOKz883U_7Y1izzLIDQTPQCbM",
  authDomain: "call-app-cc2e3.firebaseapp.com",
  projectId: "call-app-cc2e3",
  storageBucket: "call-app-cc2e3.appspot.com", // ✅ FIXED (important)
  messagingSenderId: "280577232594",
  appId: "1:280577232594:web:1fbfa58f542fd34e98270b",
  measurementId: "G-5Z90JZV942"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

const messaging = getMessaging(app);

export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BGz4EZ1EVtgjhnyE8spdvbCl0tXFDHgsdTgXqDyPk09DPtJM6W_EwyiWISQL7qqgRbDrJ6dpw0Etj_34M63A2vI",
    });

    if (token) {
      console.log("FCM Token:", token); // ✅ debug
      return token;
    } else {
      console.log("No token available");
    }
  } catch (error) {
    console.log("FCM ERROR:", error);
  }
};