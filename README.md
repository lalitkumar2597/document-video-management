# 🚀 Document & Video Management System API

A high-performance, enterprise-grade backend API built for secure document handling and low-latency video streaming. This system implements a **stateless architecture** with **Redis-backed authentication** and **Node.js Streams**.

---

## 🏗️ System Architecture

The project follows a **Layered Architecture (N-Tier)** to ensure separation of concerns, making the codebase maintainable and testable.



* **Controller Layer**: Handles HTTP requests and validates input using Joi/Zod.
* **Service Layer**: Contains core business logic (e.g., streaming logic, file processing).
* **Data Access Layer**: Abstracted via Repositories to interact with MongoDB and Redis.

---

## 🎯 Key Features

### 🔐 Advanced Security & Auth
- **JWT Refresh Token Rotation**: Implements a secure rotation strategy to detect and prevent token theft.
- **Redis Blacklisting**: Immediate logout capability by blacklisting access tokens in-memory.
- **Security Headers**: Integrated `Helmet.js` and `CORS` configurations for OWASP compliance.

### 📹 Video Streaming
- Uses **Node.js Readable Streams** to serve video files in chunks.
- Supports **Partial Content (Range Requests)**, allowing users to seek through videos without downloading the entire file.
- Memory-efficient processing that prevents server RAM spikes during heavy concurrent streaming.

### 📂 File Management
- **Multer Integration**: Secure file uploads with strict MIME-type validation and file size limits.
- **Extensible Storage**: Logic prepared for local disk storage or easy integration with AWS S3/Google Cloud Storage.

### ⚡ Performance Optimization
- **Redis Caching**: Caches frequently accessed document metadata to reduce MongoDB IOPS.
- **Database Indexing**: Optimized MongoDB queries using Compound and TTL indexes.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js & TypeScript** | Runtime & Type-safe development |
| **Express.js** | Web Framework |
| **MongoDB & Mongoose** | NoSQL Database & ODM |
| **Redis** | Caching, Session Mgmt & Socket.io Adapter |
| **Socket.io** | Real-time events and notifications |
| **Docker** | Containerization for consistent environments |


### Installation
1. **Clone the repo**
   ```bash
   git clone [https://github.com/your-username/doc-video-api.git](https://github.com/your-username/doc-video-api.git)
   cd doc-video-api
