/**
 * ============================================================================
 * DATA STRUCTURES & ALGORITHMS - SERVER
 * ============================================================================
 * This file demonstrates:
 * 1. Array operations for document storage
 * 2. Sorting algorithm (Timsort) for document ordering
 * 3. Linear search for document lookup
 * 4. WebSocket Set for client management
 * 5. File I/O for persistence
 * 6. Graph-like broadcast operations
 * ============================================================================
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "documents.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..")));

function ensureDataStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]", "utf-8");
  }
}

function readDocuments() {
  ensureDataStore();
  const data = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(data);
}

function writeDocuments(documents) {
  fs.writeFileSync(dataFile, JSON.stringify(documents, null, 2), "utf-8");
}

/**
 * ALGORITHM: Linear Search
 * Purpose: Find document by ID in array
 *
 * Time Complexity: O(n) where n = number of documents
 * Space Complexity: O(1)
 *
 * Why not O(1)?
 * - Documents stored in array, not hash map
 * - Must scan entire array in worst case
 *
 * To optimize to O(1):
 * - Use Map: documents[id] = doc
 * - Trade-off: More memory, faster lookup
 *
 * Current approach is acceptable because:
 * - Dataset is small (educational project)
 * - Simplicity preferred over optimization
 */
function findDocument(documents, id) {
  // Array.find() uses linear search
  return documents.find((doc) => doc.id === id);
}

/**
 * ENDPOINT: GET /api/documents
 * Returns: Sorted list of documents (most recent first)
 *
 * ALGORITHM: Sorting (Timsort via JavaScript's Array.sort)
 * --------------------------------------------------------
 * Time Complexity: O(n log n)
 * - Best case: O(n) when nearly sorted
 * - Average case: O(n log n)
 * - Worst case: O(n log n)
 *
 * Space Complexity: O(n)
 * - JavaScript's sort may use O(n) auxiliary space
 *
 * Algorithm Details:
 * - JavaScript engines (V8, SpiderMonkey) use Timsort
 * - Timsort is hybrid: Merge Sort + Insertion Sort
 * - Stable sort: preserves order of equal elements
 * - Optimized for real-world data patterns
 *
 * Why sort on every request?
 * - Dataset is small (acceptable for O(n log n))
 * - Ensures always fresh sorted data
 * - Alternative: maintain sorted order on insert (O(n) insert vs O(log n) with BST)
 */
app.get("/api/documents", (_req, res) => {
  const documents = readDocuments()
    // Comparator function for descending order by updatedAt
    // Returns: negative (a before b), 0 (equal), positive (b before a)
    .sort(
      (a, b) =>
        // Convert ISO strings to timestamps for numeric comparison
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    // Project only needed fields (reduce payload size)
    .map((doc) => ({ id: doc.id, title: doc.title, updatedAt: doc.updatedAt }));

  res.json(documents);
});

app.post("/api/documents", (req, res) => {
  const documents = readDocuments();
  const now = new Date().toISOString();

  const newDocument = {
    id: randomUUID(),
    title: req.body?.title?.trim() || "Untitled document",
    content: req.body?.content || "<p></p>",
    createdAt: now,
    updatedAt: now,
  };

  documents.push(newDocument);
  writeDocuments(documents);

  res.status(201).json(newDocument);
});

app.get("/api/documents/:id", (req, res) => {
  const documents = readDocuments();
  const doc = findDocument(documents, req.params.id);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(doc);
});

app.put("/api/documents/:id", (req, res) => {
  const documents = readDocuments();
  const doc = findDocument(documents, req.params.id);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  if (typeof req.body?.title === "string") {
    doc.title = req.body.title.trim() || "Untitled document";
  }

  if (typeof req.body?.content === "string") {
    doc.content = req.body.content;
  }

  doc.updatedAt = new Date().toISOString();
  writeDocuments(documents);

  res.json(doc);
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

const server = app.listen(PORT, () => {
  ensureDataStore();
  console.log(`DocsLite server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket, request) => {
  const host = request.headers.host || `localhost:${PORT}`;
  const parsed = new URL(request.url, `http://${host}`);
  const docId = parsed.searchParams.get("docId");

  if (!docId) {
    console.log("WebSocket connection rejected: missing docId");
    socket.close();
    return;
  }

  socket.docId = docId;
  socket.isAlive = true;
  console.log(`WebSocket connected for document: ${docId}`);

  // Handle pong responses to keep connection alive
  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("message", (rawMessage) => {
    let message;

    try {
      message = JSON.parse(String(rawMessage));
    } catch (_error) {
      return;
    }

    if (!message || message.docId !== docId) {
      return;
    }

    const documents = readDocuments();
    const doc = findDocument(documents, docId);

    if (doc) {
      if (message.type === "content" && typeof message.content === "string") {
        doc.content = message.content;
      }

      if (message.type === "title" && typeof message.title === "string") {
        doc.title = message.title.trim() || "Untitled document";
      }

      doc.updatedAt = new Date().toISOString();
      writeDocuments(documents);
    }

    /**
     * ALGORITHM: Selective Broadcast (Graph-like Traversal)
     * =========================================================
     * Pattern: Iterate through all connected clients and broadcast to matching subset
     *
     * Data Structure: Set (wss.clients)
     * - WebSocket library maintains Set of active connections
     * - Set ensures no duplicate clients
     * - Efficient add/remove operations: O(1)
     *
     * Algorithm:
     * 1. Iterate through all clients: O(c) where c = number of clients
     * 2. Filter by conditions:
     *    a) Not the sender (client !== socket)
     *    b) Connection is open (readyState === 1)
     *    c) Viewing same document (docId match)
     * 3. Broadcast message to matching clients: O(1) per send
     *
     * Time Complexity: O(c) where c = total connected clients
     * Space Complexity: O(1) - no additional storage
     *
     * Graph Theory Analogy:
     * - Server = central hub node
     * - Clients = leaf nodes
     * - Connections = edges
     * - This is a star topology with selective messaging
     *
     * Why not O(k) where k = clients on same document?
     * - Must check ALL clients to find matching subset
     * - Could optimize with Map: docId -> Set<clients>
     * - Trade-off: O(k) broadcast vs O(1) add/remove complexity
     */
    wss.clients.forEach((client) => {
      if (
        client !== socket && // Don't echo back to sender
        client.readyState === 1 && // WebSocket.OPEN constant
        client.docId === docId // Same document filter
      ) {
        client.send(JSON.stringify(message));
      }
    });
  });

  socket.on("error", (error) => {
    console.error(`WebSocket error for document ${docId}:`, error.message);
  });

  socket.on("close", () => {
    console.log(`WebSocket disconnected for document: ${docId}`);
  });
});

/**
 * ALGORITHM: Heartbeat / Keepalive Pattern
 * ==========================================
 * Purpose: Detect and remove dead/unresponsive WebSocket connections
 *
 * Pattern: Ping-Pong protocol
 * 1. Server sends ping every 30 seconds
 * 2. Client automatically responds with pong
 * 3. Server marks client as "alive" on pong receipt
 * 4. If no pong received, connection is terminated
 *
 * Time Complexity: O(c) where c = number of clients
 * - Must iterate all clients every 30 seconds
 *
 * Why needed?
 * - TCP connections can silently die (network issues, crashes)
 * - Without heartbeat, server holds onto dead connections
 * - Prevents resource leaks and zombie connections
 *
 * Alternative approaches:
 * - Client-initiated heartbeat
 * - Application-level ping messages
 * - TCP keepalive (less reliable)
 */
const keepaliveInterval = setInterval(() => {
  // Iterate all connected clients: O(c)
  wss.clients.forEach((socket) => {
    // Check if client responded to last ping
    if (socket.isAlive === false) {
      console.log(
        `Terminating unresponsive WebSocket for document: ${socket.docId}`,
      );
      return socket.terminate(); // Force close dead connection
    }

    // Mark as "pending response" until pong received
    socket.isAlive = false;
    socket.ping(); // Send ping frame
  });
}, 30000); // 30 second interval
