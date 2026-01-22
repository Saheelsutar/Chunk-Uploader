import Link from "next/link";
export default function Home() {
  return (
<>

<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-xl font-bold tracking-tight">
          ChunkUploader
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-medium"
        >
          Start Upload
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          Upload Large Files <br />
          <span className="text-indigo-400">
            Without Fear of Failure
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          A resilient, resumable, chunk-based upload system built to handle
          gigabyte-scale ZIP files with network failures, retries, and recovery.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/upload"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-semibold"
          >
            Upload a File
          </Link>

          <Link
            href="#features"
            className="px-6 py-3 rounded-xl border border-slate-600 hover:bg-slate-800 transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-6 pb-32 grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {[
          {
            title: "Chunked Uploads",
            desc: "Files are split into 5MB chunks and uploaded independently for maximum reliability."
          },
          {
            title: "Pause & Resume",
            desc: "Refresh the page or lose connection — uploads resume exactly where they stopped."
          },
          {
            title: "Memory Efficient",
            desc: "Streaming I/O ensures the server never loads large files into memory."
          }
        ].map((item, i) => (
          <div
            key={i}
            className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 backdrop-blur"
          >
            <h3 className="text-xl font-semibold mb-2">
              {item.title}
            </h3>
            <p className="text-slate-400">
              {item.desc}
            </p>
          </div>
        ))}
      </section>

     
    </div>
</>
  );
}
