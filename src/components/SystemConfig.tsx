import React, { useState } from "react";
import { Globe, AlertTriangle, ExternalLink, Copy, Check } from "lucide-react";

export default function SystemConfig() {
  const [showAtlasGuide, setShowAtlasGuide] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-indigo-600" />
          <div>
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-sans">MongoDB Atlas SSL & Network Assistant</h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">RESOLVABLE ACTION STEP DETAILS</p>
          </div>
        </div>
        <button
          onClick={() => setShowAtlasGuide(!showAtlasGuide)}
          className="text-xs font-semibold text-indigo-650 hover:text-indigo-800 transition px-3 py-1 bg-white border border-zinc-200 rounded-lg shadow-sm"
        >
          {showAtlasGuide ? "Hide Guide" : "Show Guide"}
        </button>
      </div>

      {showAtlasGuide && (
        <div className="p-6 space-y-5 animate-fadeIn">
          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
            <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 leading-snug">
              <AlertTriangle className="w-3.5 h-3.5" /> What causes TLV1 Alert Internal Error / SSL Handshake Failure?
            </h5>
            <p className="text-[11px] text-zinc-650 leading-relaxed mt-1">
              When deploying serverless functions to Vercel, requests are routed through a dynamic pool of cloud IP addresses that shift continuously. If your MongoDB Atlas Cluster Security Configuration does not permit traffic from wildcard addresses, MongoDB Atlas terminates the connection during the TLS handshake, causing Node.js to raise the <code className="bg-rose-50 border border-rose-100 px-1 py-0.5 rounded text-rose-600 text-[10px] font-mono font-bold">SSL routines:ssl3_read_bytes:tlsv1 alert internal error</code>.
            </p>
          </div>

          <div className="space-y-3.5">
            <h5 className="text-xs font-bold text-zinc-800 flex items-center gap-1">
              <span>🚀</span> Step-by-Step Resolution Guide for Vercel
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl relative">
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                  1
                </span>
                <h6 className="text-[11px] font-bold text-zinc-800 mb-1 mt-1">Access Network Settings</h6>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Log into your <a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold inline-flex items-center gap-0.5">MongoDB Atlas Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>, select your project, and click <strong>"Network Access"</strong> under the <strong>Security</strong> section (left menu).
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl relative">
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                  2
                </span>
                <h6 className="text-[11px] font-bold text-zinc-800 mb-1 mt-1">Whitelist Wildcard IP</h6>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Click <strong>"+ Add IP Address"</strong>, then press the <strong>"Allow Access From Anywhere"</strong> button. This populates <strong>0.0.0.0/0</strong> as the allowed CIDR range.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl relative">
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-sm">
                  3
                </span>
                <h6 className="text-[11px] font-bold text-zinc-800 mb-1 mt-1">Save & Propagate</h6>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Click <strong>"Confirm"</strong> to submit the entry. Atlas takes 1 to 2 minutes to propagate firewall changes across all replica nodes globally.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h6 className="text-xs font-bold text-zinc-800">Quick-Copy Whitelist Address Range</h6>
              <p className="text-[10px] text-zinc-500 mt-0.5">Use this wildcard value inside MongoDB Atlas to permit Vercel's dynamic serverless functions.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto shrink-0 justify-end">
              <code className="px-3 py-1.5 bg-white border border-zinc-250 text-indigo-600 font-mono font-bold rounded-lg text-xs leading-none shadow-sm flex items-center justify-center">0.0.0.0/0</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("0.0.0.0/0");
                  setCopiedId("wildcard_ip_copied");
                  setTimeout(() => setCopiedId(null), 2500);
                }}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg transition shadow-sm hover:shadow cursor-pointer"
                title="Copy wildcard IP address"
              >
                {copiedId === "wildcard_ip_copied" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Automatically fallen back to in-memory mode. Reconnect when IPs are propagated.</span>
            </div>
            <div className="font-mono text-zinc-400">
              Vercel System Environment: MONGODB_URI verified.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
