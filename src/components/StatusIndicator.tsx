import { useEffect, useState } from "react";
import { Database, RefreshCw, AlertCircle, HardDrive } from "lucide-react";
import { SystemStatus } from "../types";

export default function StatusIndicator() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Status API error");
      const data = await res.json();
      setStatus(data);
      setError(false);
    } catch (err) {
      console.error("Error fetching database status:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds to update live status
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (error) return "bg-red-500 ring-red-400/30";
    if (!status) return "bg-zinc-400 ring-zinc-400/30";
    if (status.mode === "database" && status.connected) {
      return "bg-emerald-500 ring-emerald-400/30";
    }
    if (status.mode === "memory") {
      return "bg-amber-500 ring-amber-400/30";
    }
    return "bg-red-500 ring-red-400/30";
  };

  const getStatusLabel = () => {
    if (error) return "Offline";
    if (!status) return "Querying...";
    if (status.mode === "database" && status.connected) {
      return "MongoDB Live";
    }
    if (status.mode === "memory") {
      return "Local Memory Mode";
    }
    return "Error Connecting DB";
  };

  return (
    <div className="flex flex-col gap-2 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status?.mode === "database" && status.connected ? (
            <Database className="w-4 h-4 text-emerald-600" />
          ) : (
            <HardDrive className="w-4 h-4 text-amber-650" />
          )}
          <span className="text-xs font-bold text-zinc-400 font-sans uppercase tracking-wider">
            Engine Status
          </span>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-1 hover:bg-zinc-200/60 rounded-md transition text-zinc-400 hover:text-zinc-700 disabled:opacity-40"
          title="Refresh connection state"
          id="btn-refresh-db-status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`}></span>
        </span>
        <span className="text-xs text-zinc-805 font-mono font-bold uppercase tracking-tight">
          {getStatusLabel()}
        </span>
      </div>

      <div className="text-[10px] text-zinc-500 leading-tight font-sans mt-0.5">
        {error ? (
          <span className="text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" /> Server communication error
          </span>
        ) : status?.mode === "database" && status.connected ? (
          <span>Connected to db: <strong className="text-emerald-600 font-semibold">{status.dbName}</strong></span>
        ) : (
          <div className="flex flex-col gap-1 text-zinc-500">
            <span>Demo memory storage active. Data resets on server restart.</span>
            {status?.error && (
              <span className="text-amber-600 block text-[9px] mt-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200/60 font-mono break-words leading-relaxed">
                <strong className="font-sans block text-amber-700 font-bold mb-0.5 uppercase tracking-wider text-[8px]">Database Error:</strong>
                {status.error}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
