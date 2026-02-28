# GeoSync V2

A real-time dual-sided map synchronization platform utilizing WebSockets and Google Maps API to instantly share map viewing states between users.

## The Connection System

Users must be able to join a "Session" or "Room" using a unique ID.
* The screen provides two options at first: **Join as Master** and **Join as Viewer**.
* **For Master:** Shows a link and a session ID to copy. When the Master clicks on proceed, it leads them to the map screen.
* **For Viewer (via Link):** If they open the direct link, they are routed straight to the map screen.
* **For Viewer (via UI):** If they click "Join as Viewer", an input field appears to enter the session ID, followed by a button to proceed to the map screen.

Upon joining, the system assigns (or allows selection of) two roles:
1. **The Tracker (Master):** Controls the map movement broadcast source.
2. **The Tracked (Viewer):** Observes the movement natively.

## Dual-Sided Synchronization

* **Active Sync:** When the "Tracker" pans, tilts, or zooms their map, the "Tracked" user’s map instantly updates to match the exact coordinates (lat, lng), tilt, and zoom level.
* **Passive Feedback:** The "Tracked" user still operates a functional map (able to pan, tilt, zoom locally), but their manual movements decouple them and do not override the Tracker's position. A **"Re-sync"** button appears for the viewer when disconnected to snap them back to the exact screen (lat, lng, and zoom level) of the master.
* **Socket Integration:** All map interactions are emitted via sockets to ensure real-time latency is kept under 100ms.

## Architecture

* **Frontend:** Next.js Application
* **Socket Server:** Maintained in a separate repository at [GeoSyncSocketServer](https://github.com/Navneetanavie/GeoSyncSocketServer) handling low-latency WebSocket communication.

## Tech Stack Used

* **Frontend Framework:** Next.js, React.js
* **Styling:** TailwindCSS, Lucide React (for UI Icons)
* **Real-time Communication:** Socket.io, Socket.io-client
* **Mapping Engine:** Google Maps API (`@react-google-maps/api`)
* **Utilities:** Framer Motion (assuming used for animations), clsx/tailwind-merge
* **Backend:** Node.js, Express.js (for the remote Socket Server)
