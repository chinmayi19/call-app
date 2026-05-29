import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import socket from "../socket";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [currentCallUser, setCurrentCallUser] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const phone = user?.phone?.trim(); // ✅ FIX: trim

  // ✅ JOIN SOCKET (VERY IMPORTANT FIX)
  useEffect(() => {
    if (!phone) return;

    socket.connect(); // ✅ force connect

    socket.emit("join", { phone });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join", { phone });
    });

    return () => {
      socket.off("connect");
    };
  }, [phone]);

  // ✅ FETCH CONTACTS
  useEffect(() => {
    if (phone) fetchContacts();
  }, [phone]);

  const fetchContacts = async () => {
    try {
      const res = await api.get(`/contacts?user_phone=${phone}`);
      setContacts(res.data);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  // ✅ ONLINE USERS FIX
  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      console.log("ONLINE:", users);
      setOnlineUsers(users.map(u => u.trim())); // ✅ FIX
    });

    return () => socket.off("onlineUsers");
  }, []);

  // 🎥 START STREAM
  const startLocalStream = async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    setLocalStream(stream);
    return stream;
  };

  // 🎥 PEER CONNECTION
  const createPeerConnection = (target) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      console.log("REMOTE STREAM");
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", {
          to: target,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  // 📞 CALL USER
  const callUser = async (targetPhone, type) => {
    const cleanTarget = targetPhone.trim();

    setCurrentCallUser(cleanTarget);

    const stream = await startLocalStream(type);
    const pc = createPeerConnection(cleanTarget);

    // ✅ IMPORTANT FIX
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("callUser", {
      from: phone,
      to: cleanTarget,
      type,
      offer,
    });

    peerRef.current = pc;
  };

  // 📞 INCOMING CALL
  useEffect(() => {
    socket.on("incomingCall", async (data) => {
      console.log("INCOMING CALL:", data);

      setIncomingCall(data);
      setCurrentCallUser(data.from);

      const stream = await startLocalStream(data.type);
      const pc = createPeerConnection(data.from);

      // ✅ IMPORTANT FIX
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      peerRef.current = pc;
    });

    return () => socket.off("incomingCall");
  }, []);

  // ✅ ACCEPT CALL
  const acceptCall = async () => {
    const pc = peerRef.current;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("acceptCall", {
      from: phone,
      to: incomingCall.from,
      answer,
    });

    setIncomingCall(null);
    setCallActive(true);
  };

  // ❌ REJECT
  const rejectCall = () => {
    socket.emit("rejectCall", {
      to: incomingCall.from,
    });
    setIncomingCall(null);
  };

  // ✅ CALL STARTED
  useEffect(() => {
    socket.on("callStarted", async ({ answer }) => {
      const pc = peerRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      setCallActive(true);
    });

    return () => socket.off("callStarted");
  }, []);

  // ✅ ICE
  useEffect(() => {
    socket.on("iceCandidate", async ({ candidate }) => {
      const pc = peerRef.current;
      if (!pc) return;

      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => socket.off("iceCandidate");
  }, []);

  // ❌ END CALL
  const endCall = () => {
    if (peerRef.current) peerRef.current.close();
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    socket.emit("endCall", {
      to: currentCallUser,
    });

    setCallActive(false);
    setRemoteStream(null);
  };

  useEffect(() => {
    socket.on("callEnded", () => {
      setCallActive(false);
      setRemoteStream(null);
    });

    socket.on("callRejected", () => {
      alert("Call rejected");
    });

    return () => {
      socket.off("callEnded");
      socket.off("callRejected");
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Contacts</h2>

      {/* 📞 INCOMING */}
      {incomingCall && (
        <div>
          Incoming call from {incomingCall.from}
          <button onClick={acceptCall}>Accept</button>
          <button onClick={rejectCall}>Reject</button>
        </div>
      )}

      {/* 📞 ACTIVE */}
      {callActive && (
        <div>
          Call in progress
          <button onClick={endCall}>End</button>
        </div>
      )}

      {/* 🎥 VIDEO */}
      <video
        autoPlay
        muted
        playsInline
        ref={(v) => v && localStream && (v.srcObject = localStream)}
      />

      <video
        autoPlay
        playsInline
        ref={(v) => v && remoteStream && (v.srcObject = remoteStream)}
      />

      {/* 👥 CONTACTS */}
      {contacts.length === 0 ? (
        <p>No contacts found</p>
      ) : (
        contacts.map((c) => {
          const contactPhone = c.contact_phone.trim();

          return (
            <div key={contactPhone}>
              <b>{c.name}</b> ({contactPhone})
              {onlineUsers.includes(contactPhone) ? " 🟢" : " 🔴"}

              <br />

              <button onClick={() => callUser(contactPhone, "audio")}>
                📞
              </button>

              <button onClick={() => callUser(contactPhone, "video")}>
                🎥
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Contacts;