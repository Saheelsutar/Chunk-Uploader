"use client";

export default function ChunkGrid({ chunkStatus }) {
  if (!chunkStatus || chunkStatus.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">
        Chunk Status
      </h3>

      <div className="grid grid-cols-10 gap-2">
        {chunkStatus.map((status, i) => (
          <div
            key={i}
            className={`h-6 rounded transition ${
              status === "done"
                ? "bg-green-500"
                : status === "uploading"
                ? "bg-yellow-400 animate-pulse"
                : "bg-slate-700"
            }`}
            title={`Chunk ${i + 1}: ${status}`}
          />
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-4">
        <span className="text-slate-500">Legend:</span>{" "}
        <span className="text-slate-300">Gray</span> = Pending,{" "}
        <span className="text-yellow-400">Yellow</span> = Uploading,{" "}
        <span className="text-green-400">Green</span> = Done
      </p>
    </div>
  );
}
