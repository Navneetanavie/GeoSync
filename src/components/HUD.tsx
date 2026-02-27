"use client";

import { useSocket } from "@/components/providers/SocketProvider";
import { Activity, Radio, Wifi, WifiOff } from "lucide-react";

interface HUDProps {
  role: "tracker" | "tracked";
  lat: number;
  lng: number;
  zoom: number;
  trackerActive?: boolean;
}

export function HUD({ role, lat, lng, zoom, trackerActive = true }: HUDProps) {
  const { isConnected } = useSocket();

  return (
    <div className="absolute top-4 left-4 right-4 md:right-auto md:w-80 space-y-3 z-10 pointer-events-none">
      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md border ${role === "tracker"
            ? "bg-blue-600/80 border-blue-400 text-white"
            : !trackerActive
              ? "bg-orange-600/80 border-orange-400 text-white"
              : "bg-teal-600/80 border-teal-400 text-white"
          }`}>
          {role === "tracker" ? (
            <Radio className="w-4 h-4 animate-pulse" />
          ) : !trackerActive ? (
            <Activity className="w-4 h-4 opacity-50" />
          ) : (
            <Activity className="w-4 h-4 animate-pulse" />
          )}
          <span className="font-bold text-sm tracking-wide">
            {role === "tracker"
              ? "BROADCASTING"
              : !trackerActive
                ? "TRACKER OFFLINE"
                : "SYNCING"}
          </span>
        </div>

        {/* Connection Status */}
        <div className={`p-2 rounded-full shadow-lg backdrop-blur-md border ${isConnected ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-red-500/20 border-red-500/50 text-red-400"
          }`}>
          {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
        </div>
      </div>

      {/* Stats Panel */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl font-mono text-slate-300 pointer-events-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Latitude</div>
            <div className="text-sm">{lat.toFixed(5)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Longitude</div>
            <div className="text-sm">{lng.toFixed(5)}</div>
          </div>
          <div className="col-span-2 border-t border-slate-800 pt-3 mt-1">
            <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider flex justify-between">
              <span>Zoom Level</span>
              <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-xs">{zoom.toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full ${role === "tracker" ? "bg-blue-500" : "bg-teal-500"} transition-all duration-300`}
                style={{ width: `${Math.min(100, (zoom / 22) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
