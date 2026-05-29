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
  const userId = user?.id;

  // ✅ JOIN SOCKET
  useEffect(() => {
    if (phone) {
      socket.emit("join", { phone });
    }
  }, [phone]);

  // ✅ FETCH CONTACTS
  useEffect(() => {
    if (userId) {
      fetchContacts();
    }
  }, [userId]);

  const fetchContacts = async () => {
    try {
      const res = await api.get(`/contacts?user_id=${userId}`);
      console.log("CONTACTS:", res.data);
      setContacts(res.data);
    } catch (err) {
      console.log("❌ Fetch error:", err);
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

  // 🎥 PEER
  const createPeerConnection = (target) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (e) => {
      console.log("REMOTE STREAM RECEIVED");
      setRemoteStream(e.streams[0]);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("iceCandidate", {
          to: target,
          candidate: e.candidate,
        });
      }
    };

    return pc;
  };

  // 📞 CALL
  const callUser = async (targetPhone, type) => {
    setCurrentCallUser(targetPhone);

    const stream = await startLocalStream(type);
    const pc = createPeerConnection(targetPhone);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

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

  // 📞 INCOMING
  useEffect(() => {
    socket.on("incomingCall", async (data) => {
      setIncomingCall(data);
      setCurrentCallUser(data.from);

      const stream = await startLocalStream(data.type);
      const pc = createPeerConnection(data.from);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      setPeerConnection(pc);
    });

    return () => socket.off("incomingCall");
  }, []);

  // ✅ ACCEPT
  const acceptCall = async () => {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("acceptCall", {
      from: incomingCall.from,
      to: phone,
      answer,
    });

    setIncomingCall(null);
    setCallActive(true);
  };

  // ❌ REJECT
  const rejectCall = () => {
    socket.emit("rejectCall", {
      from: phone,
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

  // ✅ ICE
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

  // ❌ END
  const endCall = () => {
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());

    socket.emit("endCall", {
      from: phone,
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
      <video autoPlay muted ref={(v) => v && (v.srcObject = localStream)} />
      <video autoPlay ref={(v) => v && (v.srcObject = remoteStream)} />

      {/* 👥 CONTACTS */}
      {contacts.length === 0 ? (
        <p>No contacts found</p>
      ) : (
        contacts.map((c) => (
          <div key={c.phone} style={{ marginBottom: "10px" }}>
            <b>{c.name}</b> ({c.phone})
            {onlineUsers.includes(c.phone) ? " 🟢" : " 🔴"}

            <br />

            <button onClick={() => callUser(c.phone, "audio")}>
              📞 Audio
            </button>

            <button onClick={() => callUser(c.phone, "video")}>
              🎥 Video
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Contacts;