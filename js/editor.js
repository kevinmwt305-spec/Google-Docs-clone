const editorEl = document.getElementById("editor");
const titleEl = document.getElementById("doc-title");
const statusEl = document.getElementById("save-status");
const editorBannerEl = document.getElementById("editor-banner");
const editorBannerTextEl = document.getElementById("editor-banner-text");
const retryConnectBtn = document.getElementById("retry-connect-btn");

const params = new URLSearchParams(window.location.search);
const documentId = params.get("id");

const apiBase = "/api/documents";
let ws;
let suppressBroadcast = false;
let saveTimer;
let quill;

if (!documentId) {
  alert("Missing document id.");
  window.location.href = "../index.html";
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showEditorBanner(message) {
  editorBannerTextEl.textContent = message;
  editorBannerEl.hidden = false;
}

function hideEditorBanner() {
  editorBannerEl.hidden = true;
}

function getEditorHtml() {
  return quill ? quill.root.innerHTML : "<p></p>";
}

function applyRemoteContent(htmlContent) {
  suppressBroadcast = true;
  if (quill) {
    quill.clipboard.dangerouslyPasteHTML(htmlContent || "<p></p>");
  }
  suppressBroadcast = false;
}

function initQuill() {
  if (typeof Quill === "undefined") {
    throw new Error("Quill failed to load.");
  }

  quill = new Quill("#editor", {
    theme: "snow",
    modules: {
      toolbar: "#editor-toolbar",
    },
  });

  quill.on("text-change", (_delta, _old, source) => {
    if (source !== "user" || suppressBroadcast) {
      return;
    }

    scheduleSave();
    sendSocketUpdate("content", getEditorHtml());
  });
}

async function loadDocument() {
  try {
    const response = await fetch(`${apiBase}/${documentId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Document not found. It may have been deleted.");
      }
      throw new Error("Unable to load document from server.");
    }

    const doc = await response.json();
    titleEl.value = doc.title;
    applyRemoteContent(doc.content || "<p></p>");
    setStatus("Loaded");

    // Only hide banner if it's not about WebSocket issues
    if (!editorBannerTextEl.textContent.includes("Live sync")) {
      hideEditorBanner();
    }
  } catch (error) {
    // Check if it's a network error (can't reach server) vs HTTP error
    if (error.message.includes("fetch")) {
      throw new Error(
        "Cannot reach backend server. Please check if it's running.",
      );
    }
    throw error;
  }
}

async function saveDocument() {
  setStatus("Saving...");

  try {
    const response = await fetch(`${apiBase}/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleEl.value.trim() || "Untitled document",
        content: getEditorHtml(),
      }),
    });

    if (!response.ok) {
      setStatus("Save failed");
      showEditorBanner(
        "Save failed. Backend may be offline or the document was deleted.",
      );
      return;
    }

    setStatus("Saved");
    // Only hide banner if it's not about WebSocket issues
    if (!editorBannerTextEl.textContent.includes("Live sync")) {
      hideEditorBanner();
    }
  } catch (error) {
    console.error("Save error:", error);
    setStatus("Save failed - Network error");
    showEditorBanner(
      "Cannot reach backend. Please check if the server is running.",
    );
  }
}

/**
 * ALGORITHM: Debouncing (Rate Limiting Pattern)
 * ==============================================
 * Purpose: Delay execution of save operation until user stops typing
 *
 * Problem Without Debouncing:
 * - User types 100 characters = 100 API calls
 * - Server overload, network congestion
 * - Poor performance, high latency
 *
 * Solution: Debounce Pattern
 * - Each keystroke resets the timer
 * - Save only executes after 900ms of inactivity
 * - 100 keystrokes at 50ms intervals = 1 save call (instead of 100)
 *
 * Time Complexity: O(1) to schedule
 * Space Complexity: O(1) - single timer reference
 *
 * Data Structure: Timer Queue (JavaScript Event Loop)
 * - setTimeout() adds callback to timer queue
 * - clearTimeout() removes callback from queue
 *
 * Visual Example:
 *   Key: A    B    C    D    E    [pause 900ms]
 *   Time: 0ms  50ms 100ms 150ms 200ms ... 1100ms
 *   Timer: [start] [reset] [reset] [reset] [reset] ... [execute]
 *
 * Without debounce: 5 saves
 * With debounce: 1 save
 *
 * Alternative Patterns:
 * - Throttling: Execute at most once per interval (e.g., every 1s)
 * - Immediate debounce: Execute immediately, then ignore for delay period
 *
 * Why 900ms?
 * - Balance between UX (doesn't wait too long) and efficiency
 * - Typical user pause between thoughts is ~1 second
 */
function scheduleSave() {
  // Cancel previous pending save (if any) - O(1)
  clearTimeout(saveTimer);

  // Schedule new save operation - O(1)
  // Callback is added to JavaScript event loop timer queue
  saveTimer = setTimeout(() => {
    saveDocument().catch((error) => {
      console.error(error);
      setStatus("Save failed");
    });
  }, 900); // Delay: 900 milliseconds
}

let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let wsReconnectTimer;
let isIntentionalClose = false;

function connectSocket() {
  // Close existing connection intentionally if open
  if (ws) {
    if (
      ws.readyState === WebSocket.OPEN ||
      ws.readyState === WebSocket.CONNECTING
    ) {
      isIntentionalClose = true;
      ws.close();
    }
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/ws?docId=${encodeURIComponent(documentId)}`;
  console.log("Connecting WebSocket to:", wsUrl);
  ws = new WebSocket(wsUrl);

  ws.addEventListener("open", () => {
    console.log("WebSocket connection established");
    isIntentionalClose = false;
    wsReconnectAttempts = 0;
    clearTimeout(wsReconnectTimer);
    setStatus("Live collaboration connected");
    hideEditorBanner();
  });

  ws.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "content" && typeof payload.content === "string") {
        applyRemoteContent(payload.content);

        setStatus("Updated from collaborator");
      }

      if (payload.type === "title" && typeof payload.title === "string") {
        titleEl.value = payload.title;
      }
    } catch (error) {
      console.error("Bad websocket message", error);
    }
  });

  ws.addEventListener("close", (event) => {
    console.log(
      `WebSocket closed. Code: ${event.code}, Reason: ${event.reason || "none"}, Clean: ${event.wasClean}, Intentional: ${isIntentionalClose}`,
    );

    // Don't reconnect if this was an intentional close
    if (isIntentionalClose) {
      isIntentionalClose = false;
      return;
    }

    setStatus("Live sync disconnected (editing still works)");

    /**
     * ALGORITHM: Exponential Backoff with Cap
     * ========================================
     * Purpose: Gradually increase retry delay to prevent server overload
     *
     * Problem: Connection failures often indicate server issues
     * - Immediate retries can worsen server load
     * - Need to "back off" and give server time to recover
     *
     * Exponential Backoff Formula:
     * delay = min(base * 2^(attempt - 1), maxDelay)
     *
     * Retry Schedule:
     * Attempt 1: min(1000 * 2^0, 30000) = 1000ms (1 second)
     * Attempt 2: min(1000 * 2^1, 30000) = 2000ms (2 seconds)
     * Attempt 3: min(1000 * 2^2, 30000) = 4000ms (4 seconds)
     * Attempt 4: min(1000 * 2^3, 30000) = 8000ms (8 seconds)
     * Attempt 5: min(1000 * 2^4, 30000) = 16000ms (16 seconds)
     * Attempt 6+: min(1000 * 2^5, 30000) = 30000ms (30 seconds, capped)
     *
     * Time Complexity: O(1) to calculate
     * Space Complexity: O(1)
     *
     * Why Exponential?
     * 1. Fast recovery from transient issues (1s first retry)
     * 2. Graceful degradation for persistent issues
     * 3. Prevents thundering herd problem (all clients retry together)
     *
     * Why Cap at 30s?
     * - Balance between persistence and user experience
     * - Beyond 30s, user likely has closed tab or lost interest
     * - Prevents indefinite waiting
     *
     * Real-world usage:
     * - Network protocols (TCP congestion control)
     * - API rate limiting (AWS, Google Cloud)
     * - Database connection pools
     * - Distributed systems (Kubernetes)
     */
    if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      wsReconnectAttempts++;

      // Calculate delay: exponential growth with maximum cap
      const delay = Math.min(
        1000 * Math.pow(2, wsReconnectAttempts - 1), // Exponential: 2^n
        30000, // Cap at 30 seconds
      );

      console.log(
        `WebSocket closed. Reconnecting in ${delay}ms (attempt ${wsReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
      );

      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(() => {
        console.log("Attempting WebSocket reconnection...");
        connectSocket();
      }, delay);
    } else {
      // Max attempts reached, show user banner
      showEditorBanner(
        "Live sync disconnected. You can still edit and save. Click reconnect to restore live sync.",
      );
    }
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    setStatus("Live sync error (editing still works)");
  });
}

function sendSocketUpdate(type, value) {
  if (!ws || ws.readyState !== WebSocket.OPEN || suppressBroadcast) {
    return;
  }

  ws.send(
    JSON.stringify({
      type,
      docId: documentId,
      [type]: value,
    }),
  );
}

editorEl.addEventListener("input", () => {
  scheduleSave();
  sendSocketUpdate("content", editorEl.innerHTML);
});

titleEl.addEventListener("input", () => {
  scheduleSave();
  sendSocketUpdate("title", titleEl.value.trim() || "Untitled document");
});

window.addEventListener("beforeunload", () => {
  clearTimeout(wsReconnectTimer);
  isIntentionalClose = true;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
});

retryConnectBtn.addEventListener("click", async () => {
  hideEditorBanner();
  setStatus("Reconnecting...");

  try {
    // Test if backend is reachable
    await loadDocument();

    // Reset reconnection attempts and try WebSocket again
    wsReconnectAttempts = 0;
    clearTimeout(wsReconnectTimer);
    connectSocket();

    setStatus("Reconnected successfully");
  } catch (error) {
    showEditorBanner(
      "Reconnect failed. Please ensure the backend server is running.",
    );
    setStatus("Unable to reconnect");
    console.error(error);
  }
});

(async () => {
  try {
    initQuill();
    await loadDocument();
    connectSocket();
  } catch (error) {
    showEditorBanner(
      "Unable to load document. Please start the backend server and click reconnect.",
    );
    setStatus("Backend offline");
    console.error(error);
  }
})();
