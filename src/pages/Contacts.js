import { useEffect, useState } from "react";
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
  const [peerConnection, setPeerConnection] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const phone = user?.phone;

  // ✅ JOIN SOCKET
  useEffect(() => {
    if (phone) {
      socket.emit("join", { phone });
    }
  }, [phone]);

  // ✅ FETCH CONTACTS
  useEffect(() => {
    if (phone) {
      fetchContacts();
    }
  }, [phone]);

  const fetchContacts = async () => {
    try {
      const res = await api.get(`/contacts?user_phone=${phone}`);
      setContacts(res.data);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  // ✅ ONLINE USERS
  useEffect(() => {
    socket.on("onlineUsers", setOnlineUsers);
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

    // ✅ RECEIVE REMOTE STREAM (IMPORTANT)
    pc.ontrack = (event) => {
      console.log("REMOTE STREAM RECEIVED");
      setRemoteStream(event.streams[0]);
    };

    // ✅ ICE
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
    setCurrentCallUser(targetPhone);

    const stream = await startLocalStream(type);
    const pc = createPeerConnection(targetPhone);

    // ✅ ADD TRACKS BEFORE OFFER
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("callUser", {
      from: phone,
      to: targetPhone,
      type,
      offer,
    });

    setPeerConnection(pc);
  };

  // 📞 INCOMING CALL
  useEffect(() => {
    socket.on("incomingCall", async (data) => {
      setIncomingCall(data);
      setCurrentCallUser(data.from);

      const stream = await startLocalStream(data.type);
      const pc = createPeerConnection(data.from);

      // ✅ ADD TRACKS BEFORE ANSWER
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      setPeerConnection(pc);
    });

    return () => socket.off("incomingCall");
  }, []);

  // ✅ ACCEPT CALL
  const acceptCall = async () => {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("acceptCall", {
      to: incomingCall.from, // ✅ FIXED
      answer,
    });

    setIncomingCall(null);
    setCallActive(true);
  };

  // ❌ REJECT CALL
  const rejectCall = () => {
    socket.emit("rejectCall", {
      to: incomingCall.from,
    });
    setIncomingCall(null);
  };

  // ✅ CALL STARTED
  useEffect(() => {
    socket.on("callStarted", async ({ answer }) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      setCallActive(true);
    });

    return () => socket.off("callStarted");
  }, [peerConnection]);

  // ✅ ICE RECEIVER
  useEffect(() => {
    socket.on("iceCandidate", async ({ candidate }) => {
      if (peerConnection) {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    return () => socket.off("iceCandidate");
  }, [peerConnection]);

  // ❌ END CALL
  const endCall = () => {
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    socket.emit("endCall", {
      to: currentCallUser,
    });

    setCallActive(false);
    setRemoteStream(null);
  };

  // ❌ LISTEN END / REJECT
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
        ref={(video) => {
          if (video && localStream) {
            video.srcObject = localStream;
          }
        }}
      />

      <video
        autoPlay
        playsInline
        ref={(video) => {
          if (video && remoteStream) {
            video.srcObject = remoteStream;
          }
        }}
      />

      {/* 👥 CONTACT LIST */}
      {contacts.length === 0 ? (
        <p>No contacts found</p>
      ) : (
        contacts.map((c) => (
          <div key={c.contact_phone} style={{ marginBottom: "10px" }}>
            <b>{c.name}</b> ({c.contact_phone})
            {onlineUsers.includes(c.contact_phone) ? " 🟢" : " 🔴"}

            <br />

            <button onClick={() => callUser(c.contact_phone, "audio")}>
              📞 Audio
            </button>

            <button onClick={() => callUser(c.contact_phone, "video")}>
              🎥 Video
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Contacts;