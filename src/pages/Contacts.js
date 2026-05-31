import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import socket from "../socket";
import IncomingCallModal from "../components/IncomingCallModal";
import VideoUpgradeModal from "../components/VideoUpgradeModal";
function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);
  
  const [calling, setCalling] = useState(false);
  const [callType, setCallType] = useState(null);
  const [currentCallUser, setCurrentCallUser] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const [muted, setMuted] = useState(false);

  const [cameraOff, setCameraOff] = useState(false);

  const [videoUpgradeRequest, setVideoUpgradeRequest] = useState(null);

  const [upgradeCountdown, setUpgradeCountdown] = useState(5);

  const peerRef = useRef(null);
  // Store ICE candidates that arrive before
  // remoteDescription is ready
  const pendingCandidates = useRef([]);


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
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ],
  });

  pc.ontrack = (event) => {
    console.log(
      "REMOTE STREAM RECEIVED",
      event.streams
    );

    const stream = event.streams[0];

    console.log(
      "Video Tracks:",
      stream.getVideoTracks()
    );

    console.log(
      "Audio Tracks:",
      stream.getAudioTracks()
    );

    setRemoteStream(stream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE:", event.candidate);

      socket.emit("iceCandidate", {
        to: target,
        candidate: event.candidate,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(
      "Connection State:",
      pc.connectionState
    );
  };

  pc.oniceconnectionstatechange = () => {
    console.log(
      "ICE State:",
      pc.iceConnectionState
    );
  };

  return pc;
};

  // 📞 CALL USER
  const callUser = async (targetPhone, type) => {
    const cleanTarget = targetPhone.trim();

    setCurrentCallUser(cleanTarget);

    setCalling(true);
    setCallType(type);

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

  peerRef.current = pc;

  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream);
  });

  await pc.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );

  console.log("Remote description set successfully");

  // Process any ICE candidates that arrived early
  for (const candidate of pendingCandidates.current) {
    try {
      await pc.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
      console.log("Queued ICE added");
    } catch (err) {
      console.error(
        "Queued ICE Error:",
        err
      );
    }
  }

  pendingCandidates.current = [];

  
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
  // ✅ CALL STARTED
useEffect(() => {
  socket.on("callStarted", async ({ answer }) => {
    const pc = peerRef.current;

    if (!pc) return;

    await pc.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    console.log(
      "Answer remote description set"
    );

    // Process queued ICE candidates
    for (const candidate of pendingCandidates.current) {
      try {
        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("Queued ICE added");
      } catch (err) {
        console.error(
          "Queued ICE Error:",
          err
        );
      }
    }

    pendingCandidates.current = [];
    
    setCalling(false);
    
    setCallActive(true);
  });

  return () => socket.off("callStarted");
}, []);

  // ✅ ICE
  // ✅ ICE
useEffect(() => {
  socket.on("iceCandidate", async ({ candidate }) => {
    const pc = peerRef.current;

    if (!pc) {
      console.log(
        "No peer connection yet, queueing candidate"
      );

      pendingCandidates.current.push(candidate);
      return;
    }

    try {
      if (!pc.remoteDescription) {
        console.log("Queueing ICE candidate");

        pendingCandidates.current.push(candidate);
        return;
      }

      await pc.addIceCandidate(
        new RTCIceCandidate(candidate)
      );

      console.log("ICE added successfully");
    } catch (err) {
      console.error(
        "ICE Add Error:",
        err
      );
    }
  });

  return () => socket.off("iceCandidate");
}, []);

  // ❌ END CALL
  const endCall = () => {
    if (peerRef.current) peerRef.current.close();
    if (localStream) localStream.getTracks().forEach(t => t.stop());

    socket.emit("endCall", {
      from: phone,
      to: currentCallUser,
    });
    setCalling(false);
    setCallActive(false);
    setRemoteStream(null);
  };

  const toggleCamera = () => {
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraOff((prev) => !prev);
  };

  useEffect(() => {
    socket.on("callEnded", () => {
      
      setCallActive(false);
      setRemoteStream(null);
    });

    socket.on("callRejected", () => {
      setCalling(false);
      alert("Call rejected");
    });

    return () => {
      socket.off("callEnded");
      socket.off("callRejected");
    };
  }, []);

  const toggleMute = () => {
    if (!localStream) return;

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMuted((prev) => !prev);
  };
  useEffect(() => {

  socket.on(
    "callCollision",
    (data) => {

      console.log(
        "CALL COLLISION",
        data
      );

      alert(
        "Call collision detected!"
      );
    }
  );

  return () => {
    socket.off(
      "callCollision"
    );
  };

}, []);

useEffect(() => {

  socket.on(
    "videoUpgradeRequest",
    (data) => {

      console.log(
        "VIDEO UPGRADE REQUEST",
        data
      );

      setVideoUpgradeRequest(data);
    }
  );

  return () => {
    socket.off(
      "videoUpgradeRequest"
    );
  };

}, []);

  useEffect(() => {

  socket.on(
    "callCancelled",
    (data) => {

      console.log(
        "CALL CANCELLED",
        data
      );

      alert(
        data.reason
      );
    }
  );

  return () => {
    socket.off(
      "callCancelled"
    );
  };

}, []);

useEffect(() => {

  if (!videoUpgradeRequest)
    return;

  setUpgradeCountdown(5);

  const interval =
    setInterval(() => {

      setUpgradeCountdown(
        (prev) => {

          if (prev <= 1) {

            clearInterval(
              interval
            );

            rejectVideoUpgrade();

            return 0;
          }

          return prev - 1;
        }
      );

    }, 1000);

  return () =>
    clearInterval(interval);

}, [videoUpgradeRequest]);

const acceptVideoUpgrade = () => {
  console.log("Video upgrade accepted");
};

const rejectVideoUpgrade = () => {
  console.log("Video upgrade rejected");
  setVideoUpgradeRequest(null);
};

  

  return (
    <div style={{ padding: "20px" }}>

      <VideoUpgradeModal
        request={videoUpgradeRequest}
        onAccept={acceptVideoUpgrade}
        onReject={rejectVideoUpgrade}
      />

      <h2>Contacts</h2>

      {/* 📞 INCOMING */}
      <IncomingCallModal
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
      {calling && (
      <div
        style={{
          border: "2px solid blue",
          padding: "15px",
          marginBottom: "15px",
          borderRadius: "10px",
        }}
      >
        <h3>
          Calling {currentCallUser}
        </h3>

        <p>
          {callType === "video"
            ? "🎥 Video Call Ringing..."
            : "📞 Audio Call Ringing..."}
        </p>

        <button onClick={endCall}>
          Cancel
        </button>
      </div>
    )}

     {/* 📞 ACTIVE */}
     {callActive && (
      <div>
        <h3>📞 Call in Progress</h3>
        <button onClick={toggleMute}>
          {muted ? "🎤 Unmute" : "🔇 Mute"}
        </button>
        {localStream?.getVideoTracks()?.length > 0 && (
          <button onClick={toggleCamera}>
            {cameraOff
              ? "📷 Turn Camera On"
              : "🚫 Turn Camera Off"}
          </button>
        )}
        
        <button onClick={endCall}>
          End Call
        </button>
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

      <audio
        autoPlay
        ref={(a) => {
          if (a && remoteStream) {
            a.srcObject = remoteStream;
          }
        }}
      />

      {/* 👥 CONTACTS */}
      {contacts.length === 0 ? (
        <p>No contacts found</p>
      ) : (
        contacts.map((c) => {
  const contactPhone = (c.contact_phone || c.phone || "").trim();

  if (!contactPhone) return null; // ✅ skip broken data

  return (
    <div key={contactPhone}>
      <b>{c.name || "Unknown"}</b> ({contactPhone})

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