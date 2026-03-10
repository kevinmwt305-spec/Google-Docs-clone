# Data Structures & Algorithms - Detailed Implementation Guide

## Overview

This document provides an in-depth analysis of the data structures and algorithms implemented in the DocsLite project, specifically designed for educational purposes in a Data Structures & Algorithms course.

---

## Table of Contents

1. [Arrays](#1-arrays)
2. [Hash Maps / Objects](#2-hash-maps--objects)
3. [Stacks (Undo/Redo)](#3-stacks-undoredo)
4. [Sets](#4-sets)
5. [Queues](#5-queues)
6. [String Algorithms](#6-string-algorithms)
7. [Sorting Algorithms](#7-sorting-algorithms)
8. [Search Algorithms](#8-search-algorithms)

---

## 1. Arrays

### Definition

An array is a contiguous block of memory that stores elements of the same type. In JavaScript, arrays are dynamic and can grow/shrink.

### Implementation in Project

#### A. Document Storage (`app.js`)

```javascript
// Global array to store all documents
let allDocuments = [];

// Time Complexity: O(1) amortized
allDocuments.push(newDocument);

// Time Complexity: O(n)
allDocuments.forEach((doc) => {
  // Process each document
});

// Time Complexity: O(n) where n is array length
const filtered = allDocuments.filter((doc) => {
  return doc.title.includes(searchTerm);
});
```

**Operations & Complexity:**

- **Access by index:** O(1)
- **Push/Pop (end):** O(1) amortized
- **Shift/Unshift (beginning):** O(n)
- **Search:** O(n)
- **Filter:** O(n)
- **ForEach:** O(n)

**Memory:**

- **Space Complexity:** O(n) where n = number of elements
- **Memory Layout:** Contiguous (in theory, JavaScript engine specific)

#### B. WebSocket Clients (`server.js`)

```javascript
// Set of connected clients (internally uses array-like structure)
wss.clients.forEach((client) => {
  if (client.docId === targetDocId) {
    client.send(message);
  }
});
```

**Use Case:** Broadcasting messages to multiple connected clients
**Time Complexity:** O(c) where c = number of connected clients

---

## 2. Hash Maps / Objects

### Definition

A hash map (JavaScript object) stores key-value pairs and provides O(1) average-case lookup time.

### Implementation in Project

#### A. Template Lookup System (`app.js`)

```javascript
const templates = {
  "resume-serif": {
    title: "Resume - Serif",
    content: "<p>Resume content...</p>",
  },
  letter: {
    title: "Letter",
    content: "<p>Letter content...</p>",
  },
  // ... more templates
};

// O(1) lookup by key
const template = templates[templateType];
```

**Hash Map Operations:**

- **Insert:** `templates[key] = value` - O(1) average
- **Lookup:** `templates[key]` - O(1) average
- **Delete:** `delete templates[key]` - O(1) average
- **Has Key:** `key in templates` - O(1) average

**Why Hash Maps?**

1. Fast lookup for templates by name
2. Easy to add/remove templates
3. Memory efficient for sparse data
4. Natural key-value relationship

#### B. Document Structure

```javascript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // Unique identifier
  "title": "My Document",
  "content": "<p>HTML content</p>",
  "createdAt": "2026-03-10T10:30:00.000Z",
  "updatedAt": "2026-03-10T11:45:00.000Z"
}
```

**Access Patterns:**

- Get title: `doc.title` - O(1)
- Get content: `doc.content` - O(1)
- Update field: `doc.updatedAt = newDate` - O(1)

---

## 3. Stacks (Undo/Redo)

### Definition

A Stack is a Last-In-First-Out (LIFO) data structure. The last element added is the first one removed.

### Stack Operations

- **Push:** Add element to top - O(1)
- **Pop:** Remove element from top - O(1)
- **Peek/Top:** View top element without removing - O(1)
- **isEmpty:** Check if stack is empty - O(1)

### Implementation for Undo/Redo

```javascript
// Two stacks for command pattern
const undoStack = []; // Stores past states
const redoStack = []; // Stores undone states

// Push state to undo stack - O(1)
function saveState(state) {
  undoStack.push(state);
  redoStack = []; // Clear redo stack on new action

  // Limit stack size to prevent memory issues
  if (undoStack.length > MAX_UNDO_STEPS) {
    undoStack.shift(); // Remove oldest - O(n) but rare
  }
}

// Undo operation - O(1)
function undo() {
  if (undoStack.length === 0) return;

  const currentState = getCurrentState();
  const previousState = undoStack.pop(); // O(1) - LIFO

  redoStack.push(currentState); // Save for redo
  restoreState(previousState);
}

// Redo operation - O(1)
function redo() {
  if (redoStack.length === 0) return;

  const currentState = getCurrentState();
  const nextState = redoStack.pop(); // O(1) - LIFO

  undoStack.push(currentState);
  restoreState(nextState);
}
```

**Why Stacks for Undo/Redo?**

1. Natural LIFO behavior matches undo/redo semantics
2. O(1) time complexity for all operations
3. Simple implementation
4. Memory efficient (only store diffs or snapshots)

**Visual Representation:**

```
Undo Stack:          Redo Stack:
[State 1]            []
[State 2]
[State 3]  ← Current

After Undo:
[State 1]            [State 3]
[State 2]  ← Current

After typing:
[State 1]            []  ← Cleared!
[State 2]
[State 4]  ← Current
```

---

## 4. Sets

### Definition

A Set is a collection of unique elements with no duplicates.

### Implementation

**WebSocket Clients:**

```javascript
// WebSocket server maintains Set of clients
wss.clients; // Built-in Set in ws library

// Operations:
// Add client: O(1)
// Remove client: O(1)
// Check existence: O(1)
// Iterate all: O(n)
```

**Advantages:**

- Automatic duplicate prevention
- Fast membership testing
- Efficient for unique collections

---

## 5. Queues

### Definition

A Queue is a First-In-First-Out (FIFO) data structure.

### Implementation - Debouncing with Timer Queue

```javascript
let saveTimer;

// Schedule save operation (enqueue)
function scheduleSave() {
  clearTimeout(saveTimer); // Remove previous queued task
  saveTimer = setTimeout(() => {
    saveDocument(); // Execute task (dequeue)
  }, 900);
}
```

**Pattern:** Debouncing

- **Enqueue:** `setTimeout()` - O(1)
- **Dequeue:** Automatic execution after delay - O(1)
- **Cancel:** `clearTimeout()` - O(1)

**Why Debouncing?**

1. **Reduces API calls:** User types 100 characters = 1 save instead of 100
2. **Optimizes performance:** Prevents server overload
3. **Improves UX:** Reduces network traffic

**Time Diagram:**

```
User Types:  A B C D E F G ... (rapid input)
Without Debounce: | | | | | | | (save each time)
With Debounce:    ............... | (save once after 900ms)
```

---

## 6. String Algorithms

### A. Substring Search (Linear)

```javascript
function filterDocuments(query) {
  const searchTerm = query.toLowerCase();
  return allDocuments.filter((doc) => {
    const title = doc.title.toLowerCase();
    return title.includes(searchTerm); // Substring search
  });
}
```

**Algorithm:** Native JavaScript `includes()` (optimized Boyer-Moore-Horspool)

- **Time Complexity:** O(n × m) worst case
  - n = length of text being searched
  - m = length of search pattern
- **Space Complexity:** O(1)

**Optimization Possibilities:**

1. **Trie:** For prefix matching - O(m) search
2. **KMP Algorithm:** O(n + m) guaranteed
3. **Rabin-Karp:** O(n + m) average with rolling hash

### B. String Manipulation

```javascript
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;") // O(n)
    .replaceAll("<", "&lt;") // O(n)
    .replaceAll(">", "&gt;") // O(n)
    .replaceAll('"', "&quot;") // O(n)
    .replaceAll("'", "&#039;"); // O(n)
}
```

**Overall Complexity:** O(5n) = O(n)
**Purpose:** Prevent XSS attacks by escaping HTML

---

## 7. Sorting Algorithms

### Implementation - Document Sorting by Date

```javascript
const sorted = documents.sort(
  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
);
```

**Algorithm:** JavaScript's built-in sort (Timsort in V8 engine)

- **Average Case:** O(n log n)
- **Best Case:** O(n) for already sorted
- **Worst Case:** O(n log n)
- **Space:** O(n)
- **Stable:** Yes (maintains relative order of equal elements)

**Timsort Details:**

1. Hybrid of Merge Sort and Insertion Sort
2. Optimized for real-world data
3. Exploits runs of already-sorted data
4. Used in Python, Java, and JavaScript engines

**Alternative Sorting Implementations:**

```javascript
// Quick Sort (average O(n log n))
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter((x) => x < pivot);
  const middle = arr.filter((x) => x === pivot);
  const right = arr.filter((x) => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// Bubble Sort (O(n²) - educational only)
function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // Swap
      }
    }
  }
  return arr;
}
```

---

## 8. Search Algorithms

### A. Linear Search (Current Implementation)

```javascript
function findDocument(documents, id) {
  return documents.find((doc) => doc.id === id);
}
```

- **Time:** O(n)
- **Space:** O(1)
- **Use Case:** Unsorted data, small datasets

### B. Binary Search (Potential Optimization)

```javascript
// Requires sorted array by ID
function binarySearch(sortedDocs, targetId) {
  let left = 0;
  let right = sortedDocs.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midId = sortedDocs[mid].id;

    if (midId === targetId) {
      return sortedDocs[mid]; // Found
    } else if (midId < targetId) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return null; // Not found
}
```

- **Time:** O(log n)
- **Space:** O(1)
- **Requirement:** Array must be sorted
- **Trade-off:** Faster search but sorting overhead O(n log n)

---

## Performance Comparison Table

| Operation       | Data Structure | Current    | Optimized | Improvement |
| --------------- | -------------- | ---------- | --------- | ----------- |
| Search docs     | Array (linear) | O(n)       | Hash Map  | O(1)        |
| Find by ID      | Array (linear) | O(n)       | Hash Map  | O(1)        |
| Sort docs       | Array          | O(n log n) | -         | -           |
| Filter docs     | Array          | O(n)       | Trie      | O(m)        |
| Undo/Redo       | Stack          | O(1)       | -         | -           |
| Template lookup | Hash Map       | O(1)       | -         | -           |
| Broadcast       | Set iteration  | O(c)       | -         | -           |

_n = documents, m = query length, c = clients_

---

## Memory Complexity Analysis

### Current Memory Usage

```javascript
// Per document: ~1-10 KB (depends on content)
Document = {
  id: "36 bytes (UUID)",
  title: "variable length string",
  content: "variable length HTML",
  createdAt: "24 bytes (ISO string)",
  updatedAt: "24 bytes (ISO string)",
};

// Total for 100 documents: ~100-1000 KB
// Total for 1000 documents: ~1-10 MB
```

### Stack Memory (Undo/Redo)

```javascript
// Each state: similar to document size
// With limit of 50 undo steps: ~50-500 KB per document
const MAX_UNDO_STEPS = 50;
```

**Memory Trade-offs:**

1. **Full Snapshots:** Fast restore but high memory
2. **Delta/Diff Storage:** Low memory but slower restore
3. **Hybrid:** Recent states as snapshots, old states as deltas

---

## Graph Theory Concepts

### WebSocket Broadcasting as Graph Traversal

```
Server (Hub)
  ├── Client 1 (Document A)
  ├── Client 2 (Document A)
  ├── Client 3 (Document B)
  └── Client 4 (Document A)
```

**Selective Broadcast Algorithm:**

```javascript
// O(V) traversal where V = number of vertices (clients)
wss.clients.forEach((client) => {
  if (client.docId === targetDocId) {
    // Filter
    client.send(message);
  }
});
```

**Graph Properties:**

- **Type:** Star topology (hub-and-spoke)
- **Edges:** WebSocket connections
- **Traversal:** Linear (DFS/BFS not needed)
- **Complexity:** O(V) where V = number of vertices

---

## Conclusion

This project demonstrates practical applications of:

1. ✅ **Arrays** for document collections
2. ✅ **Hash Maps** for O(1) lookups
3. ✅ **Stacks** for undo/redo functionality
4. ✅ **Sets** for unique client management
5. ✅ **Queues** for debouncing mechanisms
6. ✅ **String algorithms** for search
7. ✅ **Sorting algorithms** for document ordering
8. ✅ **Graph concepts** for network communication

Each data structure is chosen based on its performance characteristics and the specific requirements of the operation it supports.
