/**
 * ============================================================================
 * DATA STRUCTURES & ALGORITHMS - HOME PAGE
 * ============================================================================
 * This file demonstrates:
 * 1. Arrays for document storage
 * 2. Hash Maps (objects) for template lookup
 * 3. Linear search algorithm for filtering
 * 4. DOM manipulation
 * ============================================================================
 */

// DOM element references
const documentListEl = document.getElementById("document-list");
const emptyStateEl = document.getElementById("empty-state");
const newDocumentBtn = document.getElementById("new-document-btn");
const serverBannerEl = document.getElementById("server-banner");
const serverBannerTextEl = document.getElementById("server-banner-text");
const retryServerBtn = document.getElementById("retry-server-btn");
const searchInput = document.querySelector(".search-input");

const apiBase = "/api/documents";

/**
 * DATA STRUCTURE: Array
 * Purpose: Store all documents fetched from server
 * Operations: push O(1), filter O(n), forEach O(n)
 * Space Complexity: O(n) where n = number of documents
 */
let allDocuments = [];

/**
 * DATA STRUCTURE: Hash Map (JavaScript Object)
 * Purpose: Store templates for O(1) lookup by key
 * Time Complexity:
 *   - Lookup: O(1) average case
 *   - Insertion: O(1) average case
 * Space Complexity: O(k) where k = number of templates
 *
 * Why Hash Map? Fast constant-time access to template data by template type
 */
const templates = {
  "resume-serif": {
    title: "Resume - Serif",
    content: `<h2>Your Name</h2>
<p><em>Email: your.email@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/yourname</em></p>
<p><br></p>
<h3><strong>Professional Summary</strong></h3>
<p>Experienced professional with a proven track record in [your field]. Skilled in [key skills] and passionate about [your interests].</p>
<p><br></p>
<h3><strong>Work Experience</strong></h3>
<p><strong>Job Title</strong> - Company Name, Location</p>
<p><em>Month Year - Present</em></p>
<ul>
  <li>Achievement or responsibility description</li>
  <li>Quantifiable achievement with metrics</li>
  <li>Key project or initiative you led</li>
</ul>
<p><br></p>
<p><strong>Previous Job Title</strong> - Previous Company, Location</p>
<p><em>Month Year - Month Year</em></p>
<ul>
  <li>Achievement or responsibility description</li>
  <li>Quantifiable achievement with metrics</li>
</ul>
<p><br></p>
<h3><strong>Education</strong></h3>
<p><strong>Degree Name</strong> - University Name</p>
<p><em>Graduation Year</em></p>
<p><br></p>
<h3><strong>Skills</strong></h3>
<p>Technical Skills, Project Management, Communication, Leadership, Problem Solving</p>`,
  },
  "resume-coral": {
    title: "Resume - Coral",
    content: `<h2 style="color: #e74c3c;">Your Name</h2>
<p><em>Email: your.email@example.com | Phone: (555) 123-4567</em></p>
<p><br></p>
<h3 style="color: #e74c3c;"><strong>About Me</strong></h3>
<p>Dynamic professional with expertise in [your field]. Committed to excellence and innovation in everything I do.</p>
<p><br></p>
<h3 style="color: #e74c3c;"><strong>Experience</strong></h3>
<p><strong>Current Position</strong> at Company Name</p>
<p><em>Start Date - Present</em></p>
<ul>
  <li>Key achievement with measurable results</li>
  <li>Important responsibility or project</li>
  <li>Collaboration and leadership examples</li>
</ul>
<p><br></p>
<h3 style="color: #e74c3c;"><strong>Education & Certifications</strong></h3>
<p><strong>Degree</strong> - Institution Name, Year</p>
<p><strong>Certification</strong> - Issuing Organization, Year</p>
<p><br></p>
<h3 style="color: #e74c3c;"><strong>Core Competencies</strong></h3>
<p>• Skill 1  • Skill 2  • Skill 3  • Skill 4  • Skill 5</p>`,
  },
  letter: {
    title: "Letter",
    content: `<p style="text-align: right;"><em>Your Name</em></p>
<p style="text-align: right;"><em>Your Address</em></p>
<p style="text-align: right;"><em>City, State ZIP</em></p>
<p style="text-align: right;"><em>${new Date().toLocaleDateString()}</em></p>
<p><br></p>
<p><strong>Recipient Name</strong></p>
<p>Recipient Title</p>
<p>Company/Organization Name</p>
<p>Address</p>
<p>City, State ZIP</p>
<p><br></p>
<p>Dear [Recipient Name],</p>
<p><br></p>
<p>I am writing to [state your purpose]. [Explain the context or reason for writing this letter].</p>
<p><br></p>
<p>[Main body paragraph 1 - provide details, explanations, or supporting information].</p>
<p><br></p>
<p>[Main body paragraph 2 - continue with additional relevant information or examples].</p>
<p><br></p>
<p>Thank you for your time and consideration. I look forward to [next steps or desired outcome].</p>
<p><br></p>
<p>Sincerely,</p>
<p><br></p>
<p><br></p>
<p><strong>Your Name</strong></p>`,
  },
  "project-proposal": {
    title: "Project Proposal",
    content: `<h1>Project Proposal: [Project Name]</h1>
<p><em>Prepared by: [Your Name]</em></p>
<p><em>Date: ${new Date().toLocaleDateString()}</em></p>
<p><br></p>
<h2><strong>Executive Summary</strong></h2>
<p>Brief overview of the project, its objectives, and expected outcomes.</p>
<p><br></p>
<h2><strong>Project Background</strong></h2>
<p>Describe the context and need for this project. What problem does it solve?</p>
<p><br></p>
<h2><strong>Objectives</strong></h2>
<ul>
  <li>Primary objective and expected outcome</li>
  <li>Secondary objective and measurable goal</li>
  <li>Additional goals and success criteria</li>
</ul>
<p><br></p>
<h2><strong>Scope of Work</strong></h2>
<p><strong>Phase 1: Planning</strong></p>
<ul>
  <li>Research and discovery</li>
  <li>Stakeholder interviews</li>
  <li>Requirements gathering</li>
</ul>
<p><br></p>
<p><strong>Phase 2: Implementation</strong></p>
<ul>
  <li>Development and execution</li>
  <li>Testing and quality assurance</li>
  <li>Training and documentation</li>
</ul>
<p><br></p>
<h2><strong>Timeline & Milestones</strong></h2>
<ul>
  <li>Week 1-2: Initial planning and setup</li>
  <li>Week 3-6: Main development phase</li>
  <li>Week 7-8: Testing and refinement</li>
  <li>Week 9: Launch and handoff</li>
</ul>
<p><br></p>
<h2><strong>Budget Estimate</strong></h2>
<p>Total estimated cost: $[amount]</p>
<p>Breakdown of major expense categories</p>
<p><br></p>
<h2><strong>Conclusion</strong></h2>
<p>Summary of why this project should move forward and the value it will deliver.</p>`,
  },
  brochure: {
    title: "Brochure",
    content: `<h1 style="text-align: center;"><strong>[Your Company or Product Name]</strong></h1>
<p style="text-align: center;"><em>Tagline or brief description</em></p>
<p><br></p>
<h2 style="background-color: #9b59b6; color: white; padding: 8px;"><strong>About Us</strong></h2>
<p>Introduce your company, product, or service. Highlight what makes you unique and why customers should choose you.</p>
<p><br></p>
<h2 style="background-color: #9b59b6; color: white; padding: 8px;"><strong>Our Services</strong></h2>
<p><strong>Service 1:</strong> Description of your first service or product feature</p>
<p><br></p>
<p><strong>Service 2:</strong> Description of your second service or product feature</p>
<p><br></p>
<p><strong>Service 3:</strong> Description of your third service or product feature</p>
<p><br></p>
<h2 style="background-color: #9b59b6; color: white; padding: 8px;"><strong>Why Choose Us?</strong></h2>
<ul>
  <li><strong>Quality:</strong> We deliver exceptional quality in everything we do</li>
  <li><strong>Experience:</strong> Years of expertise in our field</li>
  <li><strong>Customer Service:</strong> Dedicated to your satisfaction</li>
  <li><strong>Innovation:</strong> Always improving and evolving</li>
</ul>
<p><br></p>
<h2 style="background-color: #9b59b6; color: white; padding: 8px;"><strong>Get In Touch</strong></h2>
<p><strong>Email:</strong> contact@example.com</p>
<p><strong>Phone:</strong> (555) 123-4567</p>
<p><strong>Website:</strong> www.example.com</p>
<p><strong>Address:</strong> 123 Main Street, City, State ZIP</p>`,
  },
};

async function fetchDocuments() {
  const response = await fetch(apiBase, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load documents.");
  }
  return response.json();
}

function showServerBanner(message) {
  serverBannerTextEl.textContent = message;
  serverBannerEl.hidden = false;
}

function hideServerBanner() {
  serverBannerEl.hidden = true;
}

function renderDocuments(documents) {
  documentListEl.innerHTML = "";

  if (!documents.length) {
    emptyStateEl.hidden = false;
    if (searchInput.value.trim()) {
      emptyStateEl.textContent = "No documents match your search.";
    } else {
      emptyStateEl.textContent =
        "No documents yet. Create your first document above.";
    }
    return;
  }

  emptyStateEl.hidden = true;

  documents.forEach((doc) => {
    const item = document.createElement("li");
    item.className = "document-card";

    const updatedAt = new Date(doc.updatedAt).toLocaleString();
    item.innerHTML = `
      <a class="document-link" href="Pages/editor.html?id=${doc.id}">
        <div class="document-preview" aria-hidden="true"></div>
        <div class="document-meta-wrap">
          <p class="document-title">${escapeHtml(doc.title || "Untitled document")}</p>
          <p class="document-meta">Updated: ${updatedAt}</p>
        </div>
      </a>
    `;

    documentListEl.appendChild(item);
  });
}

/**
 * ALGORITHM: String Sanitization
 * Purpose: Prevent XSS (Cross-Site Scripting) attacks
 * Time Complexity: O(n) where n = length of string
 *   - Each replaceAll() scans entire string: O(n)
 *   - 5 replaceAll() calls: O(5n) = O(n)
 * Space Complexity: O(n) for new string creation
 *
 * Security: Essential for preventing HTML injection in user-generated content
 */
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;") // Must be first to avoid double-escaping
    .replaceAll("<", "&lt;") // Prevent tag injection
    .replaceAll(">", "&gt;") // Prevent tag injection
    .replaceAll('"', "&quot;") // Prevent attribute injection
    .replaceAll("'", "&#039;"); // Prevent attribute injection
}

/**
 * ALGORITHM: Linear Search with Substring Matching
 * Purpose: Filter documents by title based on search query
 *
 * Time Complexity: O(n × m) where:
 *   - n = number of documents in allDocuments array
 *   - m = average length of document title
 *   - Iterates through all documents: O(n)
 *   - For each, checks if title includes searchTerm: O(m)
 *
 * Space Complexity: O(k) where k = number of matching documents
 *   - Creates new array with filtered results
 *
 * Algorithm Steps:
 * 1. Early return for empty query - O(1)
 * 2. Normalize search term (lowercase, trim) - O(m)
 * 3. Filter array with predicate function - O(n)
 * 4. For each element, normalize title and check substring - O(m)
 *
 * Optimization Opportunities:
 * - Trie data structure: O(m) search time
 * - Inverted index: O(1) word lookup + O(k) result merge
 * - Fuzzy matching: Levenshtein distance algorithm
 */
function filterDocuments(query) {
  // Base case: empty query returns all documents
  if (!query.trim()) {
    return allDocuments;
  }

  // Normalize search term for case-insensitive comparison
  const searchTerm = query.toLowerCase().trim();

  // Linear search through document array
  return allDocuments.filter((doc) => {
    const title = (doc.title || "Untitled document").toLowerCase();
    // Substring matching using native includes() - optimized Boyer-Moore-Horspool
    return title.includes(searchTerm);
  });
}

async function createDocument(
  title = "Untitled document",
  content = "<p></p>",
) {
  const response = await fetch(apiBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    showServerBanner("Cannot reach backend. Start server and retry.");
    throw new Error("Unable to create document.");
  }

  const newDoc = await response.json();
  window.location.href = `Pages/editor.html?id=${newDoc.id}`;
}

async function init() {
  try {
    const docs = await fetchDocuments();
    allDocuments = docs;
    renderDocuments(docs);
    hideServerBanner();
    console.log("Successfully loaded documents from backend");
  } catch (error) {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = "Server not running. Start backend first.";
    showServerBanner(
      "Cannot connect to backend. Please ensure the server is running and click retry.",
    );
    console.error("Failed to load documents:", error);
  }
}

/**
 * EVENT-DRIVEN SEARCH
 * Pattern: Real-time filtering without debouncing
 *
 * Why not debounce here?
 * - Filtering is fast O(n × m) for small datasets
 * - Immediate feedback improves UX
 * - Network I/O not involved (client-side only)
 *
 * If dataset grows large, consider:
 * - Debouncing: Delay filtering by 200-300ms
 * - Virtual scrolling: Only render visible items
 * - Web Workers: Offload filtering to background thread
 */
searchInput.addEventListener("input", (event) => {
  const filtered = filterDocuments(event.target.value);
  renderDocuments(filtered);
});

newDocumentBtn.addEventListener("click", async () => {
  try {
    await createDocument();
  } catch (error) {
    showServerBanner("Failed to create document. Check backend and retry.");
    console.error(error);
  }
});

newDocumentBtn.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();

  try {
    await createDocument();
  } catch (error) {
    showServerBanner("Failed to create document. Check backend and retry.");
    console.error(error);
  }
});

retryServerBtn.addEventListener("click", () => {
  hideServerBanner();
  searchInput.value = ""; // Clear search on retry
  init().catch((error) => {
    console.error(error);
  });
});

// Template card click handlers
const templateCards = document.querySelectorAll("[data-template]");
templateCards.forEach((card) => {
  const handleTemplateClick = async () => {
    const templateType = card.dataset.template;
    const template = templates[templateType];

    if (!template) {
      console.error(`Template not found: ${templateType}`);
      return;
    }

    try {
      await createDocument(template.title, template.content);
    } catch (error) {
      showServerBanner("Failed to create document. Check backend and retry.");
      console.error(error);
    }
  };

  card.addEventListener("click", handleTemplateClick);

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTemplateClick();
    }
  });
});

// Ensure banner is hidden on initial load
hideServerBanner();

init();
