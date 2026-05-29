importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBi6yBaQUAOKz883U_7Y1izzLIDQTPQCbM",
  authDomain: "call-app-cc2e3.firebaseapp.com",
  projectId: "call-app-cc2e3",
  messagingSenderId: "280577232594",
  appId: "1:280577232594:web:1fbfa58f542fd34e98270b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
    }
  );
});