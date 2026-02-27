const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join-room", ({ roomId, role }) => {
      // Leave previous rooms if any (except own id)
      Array.from(socket.rooms).forEach((room) => {
        if (room !== socket.id) socket.leave(room);
      });

      socket.join(roomId);
      socket.data.role = role;
      console.log(`User ${socket.id} joined room ${roomId} as ${role}`);

      // Let others in the room know someone joined
      socket.to(roomId).emit("user-joined", { id: socket.id, role });

      // If tracker joins, maybe broadcast a 'tracker-active' event
      if (role === "tracker") {
        socket.to(roomId).emit("tracker-active", true);
      }
    });

    socket.on("sync-map", (data) => {
      // Broadcast map update to everyone else in the room (the tracked users)
      socket.to(data.roomId).emit("map-update", data);
    });

    socket.on("request-sync", ({ roomId }) => {
      // Ask tracker in the room to emit their current state
      socket.to(roomId).emit("force-sync-publish");
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("user-left", { id: socket.id, role: socket.data.role });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
