# Chunked ZIP File Uploader

## 📌 Project Overview

This project implements a **resilient, resumable large file upload system** capable of handling ZIP files larger than **1GB**.  
The solution emphasizes **fault tolerance**, **memory-efficient streaming**, and **robust state management**.

The system is built using:
- **Frontend:** Next.js (React)
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Infrastructure:** Docker & Docker Compose

---

## 🔄 Upload Flow

1. The frontend slices a ZIP file into fixed-size chunks (default: **5MB**).
2. Each chunk is uploaded independently to the backend.
3. The backend streams chunks directly to disk at the correct byte offset.
4. MongoDB persists upload metadata and per-chunk state.
5. After all chunks are uploaded:
   - A **SHA-256 checksum** is calculated
   - The ZIP file is **peeked** to list top-level contents (without extraction)
6. The frontend displays progress, speed, ETA, chunk status, and ZIP contents.

---

## 🧠 Frontend Design

### ✅ Chunking
- Uses the `file.slice()`  to split files.
- Chunk size is configurable.

### ✅ Concurrency Control
- Uploads are limited to **3 concurrent chunks**.
- A promise-based pool enforces this limit.

### ✅ Resumable Uploads
- The `/upload/init` endpoint returns already uploaded chunks.
- Upload resumes from the last successful chunk.
- Upload session metadata is stored in `localStorage`.

### ✅ Progress Visualization
- Global progress bar (0–100%)
- Chunk status grid showing:
  - Pending
  - Uploading
  - Completed
- Live metrics:
  - Upload speed (MB/s)
  - Estimated Time Remaining (ETA)

### ✅ Retry with Exponential Backoff
- Failed chunks retry automatically up to **3 times**.
- Backoff delays: **1s → 2s → 4s**
- Retries are isolated per chunk and concurrency-safe.

---

##  Backend Design

### ✅ Streaming I/O
- Uses `fs.createWriteStream` with byte offsets.
- Files are never fully loaded into memory.

### ✅ Idempotency
- Duplicate chunks detected using `uploadId + chunkIndex`.
- Safe to retry uploads without corruption.

### ✅ Atomic Finalization
- Prevents double-finalize using upload status checks.
- Status flow:
  ```
  UPLOADING → PROCESSING → COMPLETED
  ```

### ✅ File Integrity
- Final file integrity ensured via **SHA-256 checksum**.
- Hash is computed using streaming reads.

### ✅ ZIP Peek
- ZIP metadata is read without extraction.
- Only top-level entries are listed.
- Returned in `/upload/finalize` response.

### ✅ Cleanup
- Temporary chunk files are deleted after use.
- Upload state persists in MongoDB for crash recovery.

---

## 🗄 Database Schema (MongoDB)

### Uploads Collection

| Field | Description |
|---|---|
| `_id` | Upload ID |
| `fileKey` | fileKey name(filename+totalsize) |
| `filename` | Original filename |
| `totalSize` | File size (bytes) |
| `totalChunks` | Expected number of chunks |
| `chunkSize` | chunk Size |
| `status` | UPLOADING / PROCESSING / COMPLETED / FAILED |
| `finalHash` | SHA-256 checksum |
| `Zip Entries` | content of the zip |

### Chunks Collection

| Field | Description |
|---|---|
| `_id` | chunk object id |
| `uploadId` | Parent upload |
| `chunkIndex` | Chunk number |
| `status` | RECEIVED |
| `receivedAt` | Timestamp |

---

## 🧪 Handling Failure & Edge Scenarios

### 1️⃣ Double Finalize
- Backend checks upload status before finalization.
- Only one finalize operation is allowed.

### 2️⃣ Network Flapping
- Automatic retries with exponential backoff.
- Prevents retry storms and server overload.

### 3️⃣ Out-of-Order Chunk Delivery
- Chunks are written using:
  ```
  offset = chunkIndex × chunkSize
  ```
- Arrival order does not matter.

### 4️⃣ Backend Crash Recovery
- Chunk state stored in MongoDB.
- Upload resumes correctly after backend restart.

---

## 🐳 Docker & Deployment

### Repository Structure

```
chunk_upload/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   └── src/
├── frontend/
│   ├── Dockerfile
│   └── app/
└── README.md
```

### Running the Project

```bash
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000  

---

## 📦 File Integrity & Resume Logic

- Integrity is ensured using SHA-256 hashing.
- Resume logic:
  - Detects already uploaded chunks
  - Uploads only missing chunks
  - Uses idempotent backend writes

---

## 🚀 Possible Enhancements

- Adaptive chunk sizing
- Pause/Resume button
- Scheduled cleanup jobs
- Authentication & authorization
- Cloud storage support (S3 / GCS)



---


## ✅ Conclusion

This project fulfills all functional and resiliency requirements of the assignment, with a strong focus on memory safety, concurrency control, fault tolerance, and resumable uploads.
