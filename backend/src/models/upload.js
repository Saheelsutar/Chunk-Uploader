import mongoose from "mongoose";

const UploadSchema = new mongoose.Schema(
  {
    fileKey: {
      type: String,
      required: true,
      unique: true
    },

    filename: {
      type: String,
      required: true
    },

    totalSize: {
      type: Number,
      required: true
    },

    chunkSize: {
      type: Number,
      required: true,
      default: 5 * 1024 * 1024 // 5MB
    },

    totalChunks: {
      type: Number,
      required: true
    },
    zipEntries:[],
    status: {
      type: String,
      enum: ["UPLOADING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "UPLOADING"
    },

    finalHash: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Upload = mongoose.model("Upload", UploadSchema);
export default Upload;
