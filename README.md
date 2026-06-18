# ConnectX – Real-Time Audio & Video Calling Platform

## 📌 Overview

ConnectX is a full-stack real-time communication platform that enables users to make audio and video calls through peer-to-peer WebRTC connections. The application supports user authentication, contact management, online presence detection, incoming call handling, call controls, and real-time signaling using Socket.IO.

The project was developed to explore real-time communication systems, WebRTC signaling workflows, and scalable full-stack application development.

---

## 🚀 Features

### User Management

* User Registration and Login
* JWT-based Authentication
* Secure User Sessions

### Contact Management

* Add and Manage Contacts
* Contact List Retrieval
* Real-Time Online/Offline Status

### Real-Time Communication

* Audio Calling
* Video Calling
* Incoming Call Notifications
* Accept / Reject Calls
* Call End Functionality

### Call Controls

* Mute / Unmute Microphone
* Camera On / Off
* Caller Ringing Screen
* Incoming Call Modal
* Video Upgrade Request During Active Calls

### Real-Time Updates

* Socket.IO Based Signaling
* Live Presence Tracking
* Instant Call Events

---

## 🏗️ System Architecture

Frontend (React.js)
↓
Socket.IO Client
↓
Node.js + Express.js Server
↓
Socket.IO Signaling Server
↓
WebRTC Peer-to-Peer Connection
↓
Audio / Video Streaming

Database: PostgreSQL

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript (ES6+)
* HTML5
* CSS3

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

### Real-Time Communication

* WebRTC
* Socket.IO

### Authentication

* JWT (JSON Web Token)

### Deployment

* Render
* Ngrok

### Version Control

* Git
* GitHub

---

## 📂 Project Structure

project-root/

├── frontend/

│ ├── src/

│ ├── components/

│ ├── pages/

│ ├── services/

│ └── socket.js

│

├── backend/

│ ├── routes/

│ ├── controllers/

│ ├── db/

│ ├── server.js

│ └── .env

│

└── README.md

---

## ⚙️ Installation

### Clone Repository

git clone <repository-url>

cd project-folder

### Backend Setup

cd backend

npm install

Create .env file

PORT=5000

DB_HOST=your_host

DB_USER=your_user

DB_PASSWORD=your_password

DB_NAME=your_database

JWT_SECRET=your_secret

Start Backend

npm start

### Frontend Setup

cd frontend

npm install

npm start

---

## 📡 API Endpoints

### Authentication

POST /api/auth/register

POST /api/auth/login

### Contacts

GET /contacts

POST /contacts

---

## 🔄 WebRTC Call Flow

1. User initiates a call.
2. Socket.IO sends signaling data.
3. Receiver gets incoming call notification.
4. Receiver accepts the call.
5. Offer and Answer SDP exchange occurs.
6. ICE candidates are exchanged.
7. Peer-to-peer WebRTC connection is established.
8. Audio and video streams are transmitted directly between users.

---

## 🎯 Key Learnings

* WebRTC Peer-to-Peer Communication
* SDP Offer/Answer Negotiation
* ICE Candidate Exchange
* Socket.IO Real-Time Messaging
* JWT Authentication
* React State Management
* PostgreSQL Integration
* Full-Stack Application Deployment

---

## 📈 Future Enhancements

* Missed Call History
* Call Recording
* Group Calling
* Screen Sharing
* TURN Server Integration
* Push Notifications
* Call Analytics Dashboard

---

## 👩‍💻 Author

Chinmayi H K

Aspiring Software Engineer passionate about Full-Stack Development, Cloud Technologies, Real-Time Communication Systems, and Problem Solving.

---
