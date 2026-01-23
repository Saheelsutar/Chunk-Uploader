"use client";

import { useState,useEffect,useRef } from "react";
import ChunkGrid from "./ChunkGrid";
export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [chunkStatus, setChunkStatus] = useState([]);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [error, setError] = useState("");
const [speed, setSpeed] = useState(0);
const [eta, setEta] = useState(null);
const startTimeRef = useRef(null);
const [zipEntries, setZipEntries] = useState([]);

const uploadedBytesRef = useRef(0);
const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));






  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // backend
  
  
  useEffect(() => {
  const session = localStorage.getItem("uploadSession");
  if (session) {
    setStatus("Select the same file to resume upload");
  }
}, []);
const startUpload = async () => {
  if (!file) return;

  setUploading(true);
  setStatus("Initializing upload...");
  setError("")

  // INIT (idempotent)
try{
  const initRes = await fetch(`${API_BASE}/upload/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      totalSize: file.size,
      chunkSize: CHUNK_SIZE
    })
  });

  if (!initRes.ok) {
    const err = await initRes.text();
  }

  const { uploadId, uploadedChunks = [] } = await initRes.json();
  setStartTime(Date.now());
startTimeRef.current = Date.now();
uploadedBytesRef.current = uploadedChunks.length * CHUNK_SIZE;

setUploadedBytes(uploadedBytesRef.current);


  console.log("UPLOAD ID:", uploadId);

  localStorage.setItem(
    "uploadSession",
    JSON.stringify({
      uploadId,
      filename: file.name,
      size: file.size
    })
  );

try{
  //helper function for uploading chunk
const uploadSingleChunk = async (i, uploadId, totalChunks) => {
  let attempt = 0;
  const MAX_RETRIES = 3;

  const start = i * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  const chunkBlob = file.slice(start, end);

  while (attempt <= MAX_RETRIES) {
    try {
      setStatus(
        attempt === 0
          ? `Uploading chunk ${i + 1} of ${totalChunks}`
          : `Retrying chunk ${i + 1} (attempt ${attempt})`
      );

      setChunkStatus(prev => {
        const copy = [...prev];
        copy[i] = attempt === 0 ? "uploading" : "retrying";
        return copy;
      });

      const formData = new FormData();
      formData.append("file", chunkBlob);
      formData.append("uploadId", uploadId);
      formData.append("chunkIndex", i);

      const res = await fetch(`${API_BASE}/upload/chunk`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      console.log("uploaded chunk id:", i);

      // ✅ success
      setChunkStatus(prev => {
        const copy = [...prev];
        copy[i] = "done";
        return copy;
      });

      return; // exit on success
    } catch (err) {
      attempt++;

      if (attempt > MAX_RETRIES) {
        console.error(`Chunk ${i} failed after retries`);

        setChunkStatus(prev => {
          const copy = [...prev];
          copy[i] = "failed";
          return copy;
        });

        throw err; // let concurrency controller stop upload
      }

      // exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
};

  // Initialize chunk status
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  const initialStatus = Array.from({ length: totalChunks }, (_, i) =>
    uploadedChunks.includes(i) ? "done" : "pending"
  );

  setChunkStatus(initialStatus);


  // Upload chunks
  const MAX_CONCURRENT = 3;

const pendingChunks = [];
for (let i = 0; i < totalChunks; i++) {
  if (!uploadedChunks.includes(i)) {
    pendingChunks.push(i);
  }
}

let uploadedCount = uploadedChunks.length;
let active = 0;
let index = 0;

await new Promise((resolve, reject) => {
  const next = () => {
    if (uploadedCount === totalChunks) {
      resolve();
      return;
    }

    while (active < MAX_CONCURRENT && index < pendingChunks.length) {
      const chunkIndex = pendingChunks[index++];
      active++;

      uploadSingleChunk(chunkIndex, uploadId, totalChunks)
        .then(() => {
          active--;
          uploadedCount++;
// update byte counters (sync, concurrency-safe)
uploadedBytesRef.current += CHUNK_SIZE;

const now = Date.now();
const elapsedSeconds =
  (now - startTimeRef.current) / 1000;

// ignore very early spikes
if (elapsedSeconds > 1) {
  const currentSpeed =
    uploadedBytesRef.current / elapsedSeconds;

  setSpeed(currentSpeed);

  const remainingBytes =
    file.size - uploadedBytesRef.current;

  setEta(remainingBytes / currentSpeed);
}

setUploadedBytes(uploadedBytesRef.current);


          setProgress(Math.round((uploadedCount / totalChunks) * 100));
          next();
        })
        .catch(err => {
          setError("Network error. Upload paused.");
          reject(err);
        });
    }
  };

  next();
});

}catch{
  
        setError("Connection lost. Chunk Upload paused.");
        setUploading(false);
        return; 
      
}
try{

  //  Finalize
  setStatus("Finalizing upload...");

  const finalizeRes=await fetch(`${API_BASE}/upload/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId })
  });
  

const finalizeData = await finalizeRes.json();
setZipEntries(finalizeData.zipEntries || []);

  //  Cleanup after success
  localStorage.removeItem("uploadSession");
 } catch(err){
  console.log(err)
      setError("Finalize failed. Upload paused.");
      setUploading(false);
      return;
    }
}catch(err) {
  console.log(err)
    setError("Unexpected error occurred. Upload paused.");
    setUploading(false);
  }
  finally{
    setUploading(false)
  }
};



const handleFileSelect = (file) => {
  const session = JSON.parse(localStorage.getItem("uploadSession"));

  if (session) {
    if (file.name !== session.filename || file.size !== session.size) {
      alert(`Please select the same file to resume upload - file name: ${session.filename}`);
      return;
    }
  }

  setFile(file);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex justify-center px-4">
      <div className="w-full max-w-4xl py-20">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Upload File
          </h1>
          <p className="text-slate-400 mt-2">
            Large ZIP uploads with automatic resume and recovery.
          </p>
        </div>

        {/* File Picker */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 mb-8">
          <input
            type="file"
            accept=".zip"
            id="fileInput"
            className="hidden"
             onChange={(e) => handleFileSelect(e.target.files[0])
            }
          />

          <label
            htmlFor="fileInput"
            className="cursor-pointer block border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:border-indigo-500 transition"
          >
            <div className="text-4xl mb-3">📦</div>
            <p className="font-medium">
              {file ? file.name : "Click to select a ZIP file"}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Supports files larger than 1GB
            </p>
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 mb-8">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>File size</span>
              <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
{file && (
  <button
    onClick={startUpload}
    disabled={uploading}
    className="w-full m-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold disabled:opacity-50"
  >
    {uploading ? "Uploading..." : "Start Upload"}
  </button>
)}{error && (
  <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
    {error}
  </div>
)}


            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-500 h-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>{progress}% uploaded</span>
            <span>
  Speed:{" "}
  {speed
    ? `${(speed / (1024 * 1024)).toFixed(2)} MB/s`
    : "--"}
</span>
<span>
  ETA:{" "}
  {eta
    ? eta > 60
      ? `${Math.ceil(eta / 60)} min`
      : `${Math.ceil(eta)} sec`
    : "--"}
</span>

            </div>
          </div>
        )}
        {zipEntries.length > 0 && (
  <div className="mt-8 bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
    <h3 className="text-lg font-semibold mb-4">
      ZIP Contents - {file?.name}
    </h3>

    <ul className="max-h-64 overflow-y-auto space-y-2 text-sm">
      {zipEntries.map((entry, idx) => (
        <li
          key={idx}
          className="flex items-center gap-2 text-slate-300"
        >
          <span className="text-slate-500">📄</span>
          <span className="break-all">{entry}</span>
        </li>
      ))}
    </ul>
  </div>
)}


        {/* Chunk Grid (UI Placeholder) */}
    {file && <ChunkGrid chunkStatus={chunkStatus} />}

      </div>
    </div>
  );
}
