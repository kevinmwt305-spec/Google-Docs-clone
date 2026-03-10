# Google Docs Clone (DocsLite)

A collaborative document editor built for demonstrating data structures and algorithms concepts.

## Features

- Rich text editing (bold, italic, underline, lists, alignment, headings)
- Document list page with real-time search
- Template system (Resume, Letter, Project Proposal, Brochure)
- Auto-save functionality with debouncing
- Real-time collaboration using WebSocket
- Client-side search and filtering
- Responsive design

---

## Data Structures & Algorithms Analysis

### 1. **Arrays**

#### Usage in Project:

- **Document List** (`allDocuments` in `app.js`)
  - Stores all fetched documents from the server
  - **Operations:** `push()`, `forEach()`, `filter()`
  - **Time Complexity:**
    - Access: O(1)
    - Search (linear): O(n)
    - Filter: O(n)
- **WebSocket Clients** (`wss.clients` in `server.js`)
  - Maintains active WebSocket connections
  - **Operations:** `forEach()` for broadcasting
  - **Time Complexity:** O(n) for broadcast operations

#### Example:

```javascript
// Storing documents in array
let allDocuments = [];

// Filtering operation - O(n)
const filtered = allDocuments.filter((doc) => {
  return doc.title.toLowerCase().includes(searchTerm);
});
```

### 2. **Hash Maps / Objects**

#### Usage in Project:

- **Template Storage** (`templates` object in `app.js`)
  - Key-value pairs for quick template lookup
  - **Time Complexity:** O(1) average case for lookup
- **Document Objects** (stored in `documents.json`)
  - Structured data with properties: `id`, `title`, `content`, `createdAt`, `updatedAt`
- **Message Protocol** (WebSocket messages)
  - JSON objects for structured communication

#### Example:

```javascript
// Hash map for O(1) template lookup
const templates = {
  "resume-serif": {
    title: "Resume - Serif",
    content: "...",
  },
  letter: {
    title: "Letter",
    content: "...",
  },
};

// Constant time lookup - O(1)
const template = templates[templateType];
```

### 3. **Set (via WebSocket)**

#### Usage in Project:

- **Active Connections** (`wss.clients`)
  - WebSocket server maintains a Set of active client connections
  - **Operations:** Add, delete, iterate
  - **Time Complexity:** O(1) for add/delete

### 4. **Queue (Event Queue)**

#### Usage in Project:

- **Debouncing with setTimeout** (`saveTimer` in `editor.js`)
  - Implements a queue mechanism for delayed execution
  - Prevents excessive save operations

#### Example:

```javascript
function scheduleSave() {
  clearTimeout(saveTimer); // Cancel previous queued save
  saveTimer = setTimeout(() => {
    saveDocument(); // Execute after delay
  }, 900);
}
```

**Algorithm:** Debouncing

- **Time Complexity:** O(1) to schedule
- **Space Complexity:** O(1)

---

## Algorithms Implemented

### 1. **Linear Search Algorithm**

**Location:** `app.js` - `filterDocuments()`

```javascript
function filterDocuments(query) {
  const searchTerm = query.toLowerCase().trim();
  return allDocuments.filter((doc) => {
    const title = (doc.title || "Untitled document").toLowerCase();
    return title.includes(searchTerm); // Linear search
  });
}
```

- **Time Complexity:** O(n × m) where n = number of docs, m = title length
- **Space Complexity:** O(k) where k = number of matching documents
- **Type:** Iterative, sequential search with substring matching

### 2. **Sorting Algorithm (Built-in)**

**Location:** `server.js` - Document sorting by date

```javascript
const documents = readDocuments().sort(
  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
);
```

- **Algorithm:** JavaScript's built-in sort (typically Timsort)
- **Time Complexity:** O(n log n)
- **Space Complexity:** O(n)
- **Use Case:** Display most recently updated documents first

### 3. **Broadcast Algorithm (Graph-like)**

**Location:** `server.js` - WebSocket broadcasting

```javascript
wss.clients.forEach((client) => {
  if (client !== socket && client.readyState === 1 && client.docId === docId) {
    client.send(JSON.stringify(message));
  }
});
```

- **Pattern:** Selective broadcast (similar to graph traversal)
- **Time Complexity:** O(n) where n = number of connected clients
- **Space Complexity:** O(1) for iteration
- **Algorithm Type:** Linear traversal with filtering

### 4. **Exponential Backoff (Reconnection)**

**Location:** `editor.js` - WebSocket reconnection strategy

```javascript
const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts - 1), 30000);
```

- **Algorithm:** Exponential backoff with cap
- **Sequence:** 1s, 2s, 4s, 8s, 16s, 30s (capped)
- **Time Complexity:** O(1) to calculate
- **Use Case:** Prevent overwhelming server during reconnection attempts

### 5. **String Matching (Substring Search)**

**Location:** Multiple files - Search functionality

```javascript
title.includes(searchTerm); // JavaScript's Boyer-Moore-Horspool variant
```

- **Algorithm:** Native substring search
- **Time Complexity:** O(n × m) worst case, optimized in V8 engine
- **Space Complexity:** O(1)

---

## Design Patterns

### 1. **Observer Pattern**

- **WebSocket Event Listeners:** Clients observe server events
- **DOM Event Listeners:** UI observes user interactions

### 2. **State Management**

- **Document State:** Maintained across client and server
- **Connection State:** Tracks WebSocket connection status

### 3. **Debouncing Pattern**

- Prevents excessive API calls during rapid user input
- Optimizes performance and reduces server load

---

## System Architecture

### Data Flow Diagram

```
User Input → Client-side Processing → Debounce → API Call → Server
                                    ↓
                                WebSocket
                                    ↓
                            Broadcast to Clients
```

### Storage Strategy

**File-based JSON Storage:**

- **Structure:** Array of document objects
- **Read:** O(n) - Full file read and JSON parse
- **Write:** O(n) - Full array serialization
- **Trade-off:** Simple implementation vs. scalability

```javascript
// In-memory structure (server)
[
  {
    id: "uuid-v4",
    title: "Document Title",
    content: "<p>HTML content</p>",
    createdAt: "ISO-8601 timestamp",
    updatedAt: "ISO-8601 timestamp",
  },
];
```

---

## Performance Considerations

### 1. **Time Complexity Analysis**

| Operation           | Algorithm              | Time Complexity | Space Complexity |
| ------------------- | ---------------------- | --------------- | ---------------- |
| Fetch all documents | Linear scan            | O(n)            | O(n)             |
| Search documents    | Linear search          | O(n × m)        | O(k)             |
| Get document by ID  | Linear search          | O(n)            | O(1)             |
| Create document     | Array push             | O(1) amortized  | O(1)             |
| Update document     | Linear search + update | O(n)            | O(1)             |
| Sort documents      | Timsort                | O(n log n)      | O(n)             |
| WebSocket broadcast | Linear iteration       | O(c)            | O(1)             |

_n = number of documents, m = string length, k = results, c = connected clients_

### 2. **Optimization Opportunities**

#### Current Implementation:

- **Search:** O(n) linear search through all documents
- **Document Lookup:** O(n) scanning through array

#### Potential Improvements:

1. **Hash Map for Documents:** O(1) lookup by ID
2. **Trie for Search:** O(m) search where m = query length
3. **Database with Indexing:** O(log n) for indexed queries
4. **Binary Search:** O(log n) for sorted data

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend:** Node.js, Express.js, WebSocket (ws library)
- **Editor:** Quill.js (Rich text editor)
- **Storage:** JSON file-based persistence

---

## Project Structure

```
Google-Docs-clone/
├── index.html              # Home page (document list)
├── Pages/
│   └── editor.html         # Editor page
├── js/
│   ├── app.js             # Home page logic & search
│   └── editor.js          # Editor, autosave, WebSocket
├── styles/
│   └── main.css           # All styling
├── Server/
│   ├── server.js          # Express server + WebSocket
│   └── data/
│       └── documents.json # Persistent storage
├── package.json
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm (comes with Node.js)
- Git (optional, for cloning)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Google-Docs-clone.git
cd Google-Docs-clone
```

If you already have the project folder, just open a terminal in that folder.

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Application

```bash
npm start
```

### 4. Open in Browser

Go to `http://localhost:3000`

### Optional: Verify Node and npm

```bash
node -v
npm -v
```

## Running the Project

- Home page: `http://localhost:3000`
- Editor page: open a document from the home page

---

## API Endpoints

### REST API

| Method | Endpoint             | Description                 | Complexity |
| ------ | -------------------- | --------------------------- | ---------- |
| GET    | `/api/documents`     | List all documents (sorted) | O(n log n) |
| POST   | `/api/documents`     | Create new document         | O(1)       |
| GET    | `/api/documents/:id` | Get single document         | O(n)       |
| PUT    | `/api/documents/:id` | Update document             | O(n)       |

### WebSocket Protocol

**Connection:** `ws://localhost:3000/ws?docId={documentId}`

**Message Format:**

```javascript
{
  "type": "content" | "title",
  "docId": "document-uuid",
  "content": "<p>HTML content</p>",  // if type is "content"
  "title": "Document Title"          // if type is "title"
}
```

---

## Learning Objectives (Data Structures & Algorithms)

This project demonstrates:

1.  **Arrays:** Dynamic arrays for document storage and manipulation
2.  **Hash Maps:** O(1) template lookup, object-based data structures
3.  **Linear Search:** Document filtering and search
4.  **Sorting Algorithms:** Document ordering by timestamp
5.  **String Algorithms:** Substring matching for search
6.  **Event-driven Architecture:** Asynchronous event handling
7.  **Debouncing:** Optimization pattern for performance
8.  **Graph-like Operations:** WebSocket broadcasting
9.  **Time/Space Complexity Analysis:** Performance considerations
10. **State Management:** Maintaining consistency across distributed systems

---

## Future Enhancements (Advanced Data Structures)

- **Undo/Redo:** Stack-based command pattern
- **Trie:** Autocomplete for document search
- **Linked List:** Version history with efficient insertion
- **Binary Search Tree:** Sorted document indexing
- **Priority Queue:** Scheduled autosave operations
- **Bloom Filter:** Quick document existence check

---

## Notes

- Real-time collaboration uses last-write-wins strategy
- WebSocket keepalive pings every 30 seconds
- Debounce delay: 900ms for autosave
- Maximum reconnection attempts: 5 with exponential backoff
- Data persists in `Server/data/documents.json`

---

## License

MIT License - Academic/Educational Use
