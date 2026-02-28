"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useSocket } from "@/components/providers/SocketProvider";
import { HUD } from "./HUD";
import { RefreshCcw, Loader2 } from "lucide-react";

interface MapInterfaceProps {
  roomId: string;
  role: "tracker" | "tracked";
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

export const MapInterface = ({ roomId, role }: MapInterfaceProps) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const { socket, isConnected } = useSocket();
  const mapRef = useRef<google.maps.Map | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [lat, setLat] = useState(defaultCenter.lat);
  const [lng, setLng] = useState(defaultCenter.lng);
  const [zoom, setZoom] = useState(14);
  const [tilt, setTilt] = useState(0);

  const [isSynced, setIsSynced] = useState(true);
  const [trackerState, setTrackerState] = useState({ lat: defaultCenter.lat, lng: defaultCenter.lng, zoom: 14, tilt: 0 });
  const lastUpdateFromSocket = useRef<number>(0);
  const emittedUpdateAt = useRef<number>(0);

  const trackerIsActiveState = useState(false);
  const trackerIsActive = trackerIsActiveState[0];
  const setTrackerIsActive = trackerIsActiveState[1];

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join-room", { roomId, role });

    socket.on("tracker-active", () => {
      setTrackerIsActive(true);
    });

    socket.on("user-left", (data: { id: string, role: string }) => {
      if (data.role === "tracker") {
        setTrackerIsActive(false);
      }
    });

    socket.on("force-sync-publish", () => {
      if (role === "tracker" && mapRef.current) {
        const currentCenter = mapRef.current.getCenter();
        if (currentCenter) {
          socket.emit("sync-map", {
            roomId,
            lat: currentCenter.lat(),
            lng: currentCenter.lng(),
            zoom: mapRef.current.getZoom() || 14,
            tilt: mapRef.current.getTilt() || 0,
          });
        }
      }
    });

    if (role === "tracked") {
      socket.emit("request-sync", { roomId });
    }

    const handleMapUpdate = (data: { lat: number; lng: number; zoom: number; tilt: number }) => {
      if (role === "tracked") {
        setTrackerIsActive(true);
        lastUpdateFromSocket.current = Date.now();
        setTrackerState({
          lat: data.lat,
          lng: data.lng,
          zoom: data.zoom,
          tilt: data.tilt || 0
        });

        if (isSynced && mapRef.current) {
          mapRef.current.panTo({ lat: data.lat, lng: data.lng });
          if (mapRef.current.getZoom() !== data.zoom) {
            mapRef.current.setZoom(data.zoom);
          }
          if (mapRef.current.getTilt() !== data.tilt) {
            mapRef.current.setTilt(data.tilt || 0);
          }
        }
      }
    };

    socket.on("map-update", handleMapUpdate);

    return () => {
      socket.off("map-update", handleMapUpdate);
      socket.off("tracker-active");
      socket.off("user-left");
      socket.off("force-sync-publish");
    };
  }, [socket, isConnected, roomId, role]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setTilt(tilt);
    map.setMapTypeId("roadmap");
  }, [tilt]);

  const onMapChange = useCallback(() => {
    if (!mapRef.current) return;

    const currentCenter = mapRef.current.getCenter();
    if (!currentCenter) return;

    const currentLat = currentCenter.lat();
    const currentLng = currentCenter.lng();
    const currentZoom = mapRef.current.getZoom() || 14;
    const currentTilt = mapRef.current.getTilt() || 0;

    setLat(currentLat);
    setLng(currentLng);
    setZoom(currentZoom);
    setTilt(currentTilt);

    if (role === "tracker") {
      const now = Date.now();
      if (now - emittedUpdateAt.current > 80 && socket && isConnected) {
        emittedUpdateAt.current = now;
        socket.emit("sync-map", {
          roomId,
          lat: currentLat,
          lng: currentLng,
          zoom: currentZoom,
          tilt: currentTilt,
        });
        console.log("Tracker emitting:", currentLat, currentLng);
      }
    }
    console.log("Map changed:", currentLat, currentLng);
  }, [role, socket, isConnected, roomId]);

  const handleUserInteraction = useCallback(() => {
    if (role === "tracked" && isSynced) {
      setIsSynced(false);
    }
  }, [role, isSynced]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (mapRef.current) {
          mapRef.current.panBy(e.deltaX, e.deltaY);
          handleUserInteraction();
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener("wheel", handleWheel, { capture: true } as any);
    };
  }, [handleUserInteraction]);

  const handleResync = () => {
    setIsSynced(true);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: trackerState.lat, lng: trackerState.lng });
      mapRef.current.setZoom(trackerState.zoom);
      mapRef.current.setTilt(trackerState.tilt || 0);
    }
    if (socket && isConnected) {
      socket.emit("request-sync", { roomId });
    }
  };

  const handleResetToDefault = () => {
    if (mapRef.current) {
      mapRef.current.panTo(defaultCenter);
      mapRef.current.setZoom(14);
      mapRef.current.setTilt(0);

      if (socket && isConnected) {
        socket.emit("sync-map", {
          roomId,
          lat: defaultCenter.lat,
          lng: defaultCenter.lng,
          zoom: 14,
          tilt: 0,
        });
      }
    }
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-red-400">
        <p>Error loading Google Maps.</p>
        <p className="text-sm text-slate-500 mt-2">Did you provide a valid API key?</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p>Loading Map Environment...</p>
      </div>
    );
  }

  const isMismatched = role === "tracked" && trackerIsActive && (
    Math.abs(lat - trackerState.lat) > 0.0005 ||
    Math.abs(lng - trackerState.lng) > 0.0005 ||
    Math.abs(zoom - trackerState.zoom) > 0.5
  );

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full relative"
      onTouchStartCapture={handleUserInteraction}
    >
      <HUD role={role} lat={lat} lng={lng} zoom={zoom} trackerActive={trackerIsActive} />

      {role === "tracked" && !isSynced && trackerIsActive && isMismatched && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={handleResync}
            className="bg-orange-500/90 hover:bg-orange-500 text-white px-4 py-2 rounded-full shadow-xl shadow-orange-500/20 backdrop-blur-md font-medium text-sm flex items-center gap-2 transition-all border border-orange-400 animate-pulse"
          >
            <RefreshCcw className="w-4 h-4" />
            Re-sync
          </button>
        </div>
      )}

      {role === "tracker" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={handleResetToDefault}
            className="bg-blue-600/90 hover:bg-blue-500 text-white px-4 py-2 rounded-full shadow-xl shadow-blue-500/20 backdrop-blur-md font-medium text-sm flex items-center gap-2 transition-all border border-blue-400"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset Initial View
          </button>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat, lng }}
        zoom={zoom}
        onLoad={onMapLoad}
        onBoundsChanged={onMapChange}
        onIdle={onMapChange}
        onDragStart={handleUserInteraction}
        onDblClick={handleUserInteraction}
        options={{
          disableDefaultUI: false,
          zoomControl: role === "tracker",
          streetViewControl: false,
          mapTypeControl: false,
          tilt: 0,
          gestureHandling: "greedy",
        }}
      />
    </div>
  );
};
