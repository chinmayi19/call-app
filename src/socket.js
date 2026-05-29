import { io } from "socket.io-client";

const socket = io("https://call-app-cbwo.onrender.com", {
  transports: ["websocket"],
  withCredentials: false,
});

export default socket;