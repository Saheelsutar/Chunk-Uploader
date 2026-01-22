import fs from "fs";
import path from "path";
import crypto from "crypto";
import Upload from "../models/upload.js";
import Chunk from "../models/chunk.js";
import yauzl from "yauzl";



const UPLOAD_DIR = path.resolve("uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}



const peekZip = (zipPath) =>
  new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      const entries = [];

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        // Ignore directories
        if (!entry.fileName.endsWith("/")) {
          entries.push(entry.fileName);
        }
        zipfile.readEntry();
      });

      zipfile.on("end", () => {
        zipfile.close();
        resolve(entries);
      });

      zipfile.on("error", reject);
    });
  });



export const initUpload = async (req, res) => {
  const { filename, totalSize, chunkSize } = req.body;

  const fileKey = `${filename}_${totalSize}`;

  let upload = await Upload.findOne({ fileKey });

  if (!upload) {
    const totalChunks = Math.ceil(totalSize / chunkSize);

    upload = await Upload.create({
      fileKey,
      filename,
      totalSize,
      chunkSize,
      totalChunks
    });
  }

  const chunks = await Chunk.find({ uploadId: upload._id })
    .select("chunkIndex");

  res.json({
    uploadId: upload._id,
    uploadedChunks: chunks.map(c => c.chunkIndex)
  });
};


export const uploadChunk = async (req, res) => {
  const { uploadId, chunkIndex } = req.body;
  const chunk = req.file;


  if (!chunk) {
    return res.status(400).json({ message: "No chunk received" });
  }

  // Idempotency check
  const exists = await Chunk.findOne({ uploadId, chunkIndex });
  if (exists) {
    // cleanup duplicate temp file
    fs.unlinkSync(chunk.path);
    return res.status(200).json({ message: "Chunk already uploaded" });
  }

  const upload = await Upload.findById(uploadId);
  if (!upload) {
    fs.unlinkSync(chunk.path);
    return res.status(404).json({ message: "Upload not found" });
  }

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const filePath = path.join(UPLOAD_DIR, upload.fileKey);


  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, "w"));
  }

  const start = Number(chunkIndex) * upload.chunkSize;

  let responded = false;

  const writeStream = fs.createWriteStream(filePath, {
    flags: "r+",
    start
  });

  fs.createReadStream(chunk.path).pipe(writeStream);

  writeStream.on("close", async () => {
    if (responded) return;
    responded = true;

    await Chunk.create({
      uploadId,
      chunkIndex,
      status: "RECEIVED"
    });

    fs.unlinkSync(chunk.path);

    res.status(200).json({ message: "Chunk uploaded" });
  });

  writeStream.on("error", err => {
    console.error(err);

    if (!responded) {
      responded = true;
      res.status(500).json({ message: "Chunk write failed" });
    }
  });
};



export const finalizeUpload = async (req, res) => {
  const { uploadId } = req.body;

  const upload = await Upload.findById(uploadId);
  if (!upload) {
    return res.status(404).json({ message: "Upload not found" });
  }

  // Double-finalize protection
  if (upload.status !== "UPLOADING") {
    return res.status(200).json({
      message: "Upload already finalized",
      status: upload.status
    });
  }

  // Ensure all chunks received
  const chunkCount = await Chunk.countDocuments({ uploadId });
  if (chunkCount !== upload.totalChunks) {
    return res.status(400).json({
      message: "Upload incomplete",
      received: chunkCount,
      expected: upload.totalChunks
    });
  }

  upload.status = "PROCESSING";
  await upload.save();

  const filePath = path.join(UPLOAD_DIR, upload.fileKey);

  try {
    // Streaming SHA-256
    const hash = crypto.createHash("sha256");
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("data", data => hash.update(data));

    fileStream.on("end", async () => {
      const finalHash = hash.digest("hex");


      yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          upload.status = "FAILED";
          upload.save();
          return res.status(500).json({ message: "Invalid ZIP file" });
        }

        const entries = [];

        zipfile.readEntry();
        zipfile.on("entry", entry => {

          if (!entry.fileName.includes("/")) {
            entries.push(entry.fileName);
          }
          zipfile.readEntry();
        });

        zipfile.on("end", async () => {
          upload.finalHash = finalHash;
          const zipEntries = await peekZip(filePath);

          upload.status = "COMPLETED";
          upload.zipEntries = zipEntries;
          await upload.save();

          res.json({
            message: "Upload completed successfully",
            sha256: finalHash,
            zipEntries
          });
        });
      });
    });

    fileStream.on("error", async err => {
      upload.status = "FAILED";
      await upload.save();
      res.status(500).json({ message: "File read failed" });
    });
  } catch (err) {
    upload.status = "FAILED";
    await upload.save();
    res.status(500).json({ message: "Finalize failed" });
  }
};
