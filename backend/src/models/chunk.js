import mongoose from "mongoose";

const ChunkSchema = new mongoose.Schema(
  {
    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: true
    },

    chunkIndex: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "RECEIVED"],
      default: "RECEIVED"
    },

    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

ChunkSchema.index(
  { uploadId: 1, chunkIndex: 1 },
  { unique: true }
);

const Chunk = mongoose.model("Chunk", ChunkSchema);
export default Chunk;
