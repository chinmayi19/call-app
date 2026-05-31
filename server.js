const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ✅ FIXED CORS (allow all for now)
app.use(cors({
  origin: true,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// ✅ DB
const pool = require("./db");

// ✅ ROUTES
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/auth", authRoutes);
app.use("/contacts", contactRoutes);

// ✅ TEST ROUTE
app.get("/test", (req, res) => {
  res.send("Backend is working 🚀");
});

// ✅ DB TEST
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "DB connected ✅",
      time: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      message: "DB failed ❌",
      error: err.message,
    });
  }
});

// ✅ SOCKET.IO (FIXED)
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  }
});

let onlineUsers = {};
let activeCalls = {};

function getCallKey(a, b) {
  return [a, b].sort().join("-");
}


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ JOIN
  socket.on("join", ({ phone }) => {
    if (!phone) return;

    onlineUsers[phone] = socket.id;

    console.log("ONLINE USERS:", onlineUsers);

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // ✅ CALL USER
  socket.on("callUser", ({ from, to, offer, type }) => {

  const callKey = getCallKey(from, to);

  console.log(
    "CALL ATTEMPT:",
    callKey,
    type
  );

  // 🚨 COLLISION DETECTED
  if (activeCalls[callKey]) {

    console.log(
      "CALL COLLISION DETECTED:",
      callKey
    );

    io.to(socket.id).emit("callCollision", {
      existingCall: activeCalls[callKey]
    });

    return;
  }

  // Save active call
  activeCalls[callKey] = {
    caller: from,
    receiver: to,

    callType: type,

    status: "ringing",

    timestamp: Date.now(),

    pendingUpgrade: null
  };

  console.log(
    "ACTIVE CALL STORED:",
    activeCalls[callKey]
  );

  console.log(
    "STATUS:",
    activeCalls[callKey].status
  );

  if (onlineUsers[to]) {

    io.to(onlineUsers[to]).emit(
      "incomingCall",
      {
        from,
        offer,
        type,
      }
    );

  } else {

    console.log(
      "User not online:",
      to
    );

  }

});

  // ✅ ACCEPT CALL (FIXED)
  socket.on("acceptCall", ({ to, answer }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("callStarted", {
        answer,
      });
    }
  });

  // ✅ ICE CANDIDATE
  socket.on("iceCandidate", ({ to, candidate }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("iceCandidate", {
        candidate,
      });
    }
  });

  // ✅ END CALL
 socket.on("endCall", ({ from, to }) => {

  const callKey =
    getCallKey(from, to);

  delete activeCalls[callKey];

  console.log(
    "ACTIVE CALL REMOVED:",
    callKey
  );

  if (onlineUsers[to]) {
    io.to(onlineUsers[to]).emit(
      "callEnded"
    );
  }
});

  // ✅ REJECT CALL
  socket.on("rejectCall", ({ to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("callRejected");
    }
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    for (let phone in onlineUsers) {
      if (onlineUsers[phone] === socket.id) {
        delete onlineUsers[phone];
      }
    }

    io.emit("onlineUsers", Object.keys(onlineUsers));
  });
});

// ✅ PORT
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});