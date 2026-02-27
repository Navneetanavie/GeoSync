"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, Copy, Check, ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";

function generateSessionId() {
  return "SYNC-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"master" | "viewer">("master");
  const [sessionId, setSessionId] = useState("");
  // Generating on first render is fine, the mismatch happens during rendering, 
  // not state creation itself.
  const [masterSessionId] = useState(() => generateSessionId());
  const [idCopied, setIdCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(masterSessionId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/session/${masterSessionId}?role=tracked`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const joinAsMaster = () => {
    router.push(`/session/${masterSessionId}?role=tracker`);
  };

  const joinAsViewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim().length > 0) {
      router.push(`/session/${sessionId.toUpperCase().trim()}?role=tracked`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-8 text-center border-b border-slate-700/50 pb-6">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">GeoSync</h1>
          <p className="text-slate-400 text-sm">Real-time map synchronization. Choose how you want to connect.</p>
        </div>

        <div className="flex bg-slate-900/50">
          <button
            onClick={() => setActiveTab("master")}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "master" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/40" : "text-slate-500 hover:text-slate-300"
              }`}
          >
            <Users className="w-4 h-4" />
            Host Session
          </button>
          <button
            onClick={() => setActiveTab("viewer")}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === "viewer" ? "text-teal-400 border-b-2 border-teal-400 bg-slate-800/40" : "text-slate-500 hover:text-slate-300"
              }`}
          >
            <Play className="w-4 h-4" />
            Join Session
          </button>
        </div>

        <div className="p-8">
          {activeTab === "master" ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Your Session ID
              </label>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center font-mono text-xl tracking-widest text-slate-200">
                  {isMounted ? masterSessionId : "SYNC-XXXX"}
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600 flex items-center justify-center text-slate-300"
                  title="Copy ID"
                >
                  {idCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 mt-4">
                Direct Invite Link
              </label>
              <div className="flex gap-2 mb-6">
                <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-left font-mono text-sm tracking-tight text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                  {isMounted ? `${window.location.origin}/session/${masterSessionId}` : "Loading link..."}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600 flex items-center justify-center text-slate-300 whitespace-nowrap text-sm font-medium"
                  title="Copy Link"
                >
                  {linkCopied ? <Check className="w-5 h-5 text-green-400" /> : "Copy Link"}
                </button>
              </div>
              <button
                onClick={joinAsMaster}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                Start Broadcasting <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <form onSubmit={joinAsViewer}>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Enter Session ID
                </label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  placeholder="SYNC-XXXX"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center font-mono text-xl tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all mb-6"
                  required
                />
                <button
                  type="submit"
                  disabled={!sessionId.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-500/20 disabled:shadow-none"
                >
                  Sync to Master <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
