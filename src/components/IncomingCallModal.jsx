function IncomingCallModal({
  incomingCall,
  onAccept,
  onReject,
}) {
  if (!incomingCall) return null;

  return (
    <>
      {/* Dark Background Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          boxShadow: "0px 0px 15px rgba(0,0,0,0.3)",
          textAlign: "center",
          zIndex: 9999,
          minWidth: "320px",
        }}
      >
        <h2>📞 Incoming Call</h2>

        <h3>{incomingCall.from}</h3>

        <p>
          {incomingCall.type === "video"
            ? "🎥 Video Call"
            : "📞 Audio Call"}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            marginTop: "20px",
          }}
        >
          <button
            onClick={onAccept}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ✅ Accept
          </button>

          <button
            onClick={onReject}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </>
  );
}

export default IncomingCallModal;