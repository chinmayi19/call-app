import React from "react";

function VideoUpgradeModal({
  request,
  onAccept,
  onReject,
}) {
  if (!request) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "rgba(0,0,0,0.5)",
          zIndex: 9998,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform:
            "translate(-50%, -50%)",
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          zIndex: 9999,
          textAlign: "center",
        }}
      >
        <h3>
          Video Upgrade Request
        </h3>

        <p>
          {request.requestedBy}
          {" "}
          wants to switch to Video
        </p>

        <p>
            Auto decision in
            {" "}
            {5}
            {" "}
            seconds
        </p>

        <button
          onClick={onAccept}
        >
          YES
        </button>

        <button
          onClick={onReject}
          style={{
            marginLeft: "10px",
          }}
        >
          NO
        </button>
      </div>
    </>
  );
}

export default VideoUpgradeModal;