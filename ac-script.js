// ══════════════════════════════════════════════════════
// CONFIG — adapt these to your app
// ══════════════════════════════════════════════════════

// Fixed suggestions per provider (your PROVIDERS constant)
const FIXED_MODELS = {
  openai:    ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  gemini:    ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"],
  anthropic: ["claude-sonnet-4-5", "claude-haiku-4-5-20251001", "claude-opus-4-5"],
};

// API fetch endpoints per provider
// In your real app, these read state.apiKey and state.provider
const FETCH_ENDPOINTS = {
  openai:    async (key) => {
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` }
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return (d.data || []).map(m => m.id).filter(id => id.startsWith("gpt-")).sort();
  },
  gemini:    async (key) => {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return (d.models || [])
      .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
      .map(m => m.name.replace("models/", ""));
  },
  anthropic: async (key) => {
    const r = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      }
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
    return (d.data || []).map(m => m.id);
  },
};

// ══════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════

// In your real app, read from state.provider / state.apiKey
// Here we mock them for the demo
const mockState = {
  provider: "gemini",
  apiKey:   "",          // paste a real key to test Fetch
  model:    "",
};

let apiModels   = [];   // models fetched from API
let focusedIdx  = -1;   // keyboard navigation index
let allOptions  = [];   // flat list of currently rendered options (for keyboard nav)

// ══════════════════════════════════════════════════════
// DOM refs
// ══════════════════════════════════════════════════════
const input     = document.getElementById("acInput");
const dropdown  = document.getElementById("acDropdown");
const fetchBtn  = document.getElementById("acFetchBtn");
const fetchIcon = document.getElementById("acFetchIcon");
const fetchLbl  = document.getElementById("acFetchLabel");
const status    = document.getElementById("acStatus");
const demoOut   = document.getElementById("demoOutput"); // demo only

// ══════════════════════════════════════════════════════
// RENDER DROPDOWN
// ══════════════════════════════════════════════════════
function renderDropdown(query) {
  const q = query.trim().toLowerCase();
  dropdown.innerHTML = "";
  allOptions = [];
  focusedIdx = -1;

  const fixed  = FIXED_MODELS[mockState.provider] || [];
  const groups = [];

  // API models section (if any fetched)
  if (apiModels.length > 0) {
    const filtered = q
      ? apiModels.filter(m => m.toLowerCase().includes(q))
      : apiModels;
    if (filtered.length) groups.push({ label: "From API", models: filtered, badge: "badge-api", source: "api" });
  }

  // Fixed suggestions section
  {
    const filtered = q
      ? fixed.filter(m => m.toLowerCase().includes(q) && !apiModels.includes(m))
      : fixed.filter(m => !apiModels.includes(m));
    if (filtered.length) groups.push({ label: "Suggestions", models: filtered, badge: "badge-fixed", source: "fixed" });
  }

  if (groups.length === 0 && q) {
    // Free text: allow typing anything — show "use as-is" hint
    const empty = document.createElement("div");
    empty.className = "ac-empty";
    empty.textContent = `No match — press Enter to use "${query}"`;
    dropdown.appendChild(empty);
    dropdown.classList.add("open");
    return;
  }

  if (groups.length === 0) {
    dropdown.classList.remove("open");
    return;
  }

  groups.forEach(group => {
    const sec = document.createElement("div");
    sec.className = "ac-section";
    sec.textContent = group.label;
    dropdown.appendChild(sec);

    group.models.forEach(model => {
      const opt = document.createElement("div");
      opt.className = "ac-option";
      opt.setAttribute("role", "option");
      opt.dataset.value = model;

      const name = document.createElement("span");
      name.className = "ac-opt-name";
      name.innerHTML = q ? highlight(model, q) : escHtml(model);

      const badge = document.createElement("span");
      badge.className = `ac-opt-badge ${group.badge}`;
      badge.textContent = group.source === "api" ? "API" : "default";

      opt.appendChild(name);
      opt.appendChild(badge);

      opt.addEventListener("mousedown", (e) => {
        e.preventDefault(); // don't blur input
        selectModel(model);
      });

      dropdown.appendChild(opt);
      allOptions.push(opt);
    });
  });

  dropdown.classList.add("open");
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escHtml(text);
  return escHtml(text.slice(0, idx))
    + `<mark>${escHtml(text.slice(idx, idx + query.length))}</mark>`
    + escHtml(text.slice(idx + query.length));
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ══════════════════════════════════════════════════════
// SELECT MODEL
// ══════════════════════════════════════════════════════
function selectModel(value) {
  input.value          = value;
  mockState.model      = value;
  demoOut.textContent  = value;           // demo only — in real app: state.model = value
  localStorage.setItem("jlm_model_" + mockState.provider, value);
  closeDropdown();
  setStatus(`✓ ${value}`, "ok");
}

// ══════════════════════════════════════════════════════
// OPEN / CLOSE
// ══════════════════════════════════════════════════════
function openDropdown() {
  renderDropdown(input.value);
}

function closeDropdown() {
  dropdown.classList.remove("open");
  focusedIdx = -1;
}

// ══════════════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ══════════════════════════════════════════════════════
function moveFocus(dir) {
  if (!allOptions.length) return;
  allOptions.forEach(o => o.classList.remove("focused"));
  focusedIdx = (focusedIdx + dir + allOptions.length) % allOptions.length;
  allOptions[focusedIdx].classList.add("focused");
  allOptions[focusedIdx].scrollIntoView({ block: "nearest" });
}

// ══════════════════════════════════════════════════════
// FETCH FROM API
// ══════════════════════════════════════════════════════
async function fetchModels() {
  // In your real app replace mockState with state
  const key = mockState.apiKey || prompt("Paste your API key to test fetch:");
  if (!key) return;
  mockState.apiKey = key;

  fetchBtn.disabled = true;
  fetchBtn.classList.add("loading");
  fetchLbl.textContent = "…";
  setStatus("Fetching models…", "");

  try {
    const fn = FETCH_ENDPOINTS[mockState.provider];
    if (!fn) throw new Error("No fetch function for provider: " + mockState.provider);
    apiModels = await fn(key);
    setStatus(`✓ ${apiModels.length} models loaded from API`, "ok");
    openDropdown();
  } catch (e) {
    setStatus("Error: " + e.message, "err");
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.classList.remove("loading");
    fetchLbl.textContent = "Fetch";
  }
}

// ══════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════
function setStatus(msg, type) {
  status.textContent = msg;
  status.className   = "ac-status" + (type ? " " + type : "");
}

// ══════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════
input.addEventListener("focus", () => openDropdown());

input.addEventListener("input", () => {
  renderDropdown(input.value);
  mockState.model = input.value; // allow free typing
  demoOut.textContent = input.value || "—";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown")  { e.preventDefault(); moveFocus(+1); }
  if (e.key === "ArrowUp")    { e.preventDefault(); moveFocus(-1); }
  if (e.key === "Enter") {
    e.preventDefault();
    if (focusedIdx >= 0 && allOptions[focusedIdx]) {
      selectModel(allOptions[focusedIdx].dataset.value);
    } else if (input.value.trim()) {
      selectModel(input.value.trim());
    }
  }
  if (e.key === "Escape") { closeDropdown(); input.blur(); }
});

input.addEventListener("blur", () => {
  // Small delay so mousedown on option fires first
  setTimeout(() => closeDropdown(), 120);
});

fetchBtn.addEventListener("click", fetchModels);

// Close on outside click
document.addEventListener("mousedown", (e) => {
  if (!document.getElementById("acWrap").contains(e.target)) closeDropdown();
});

// ══════════════════════════════════════════════════════
// INIT — restore saved model
// ══════════════════════════════════════════════════════
const saved = localStorage.getItem("jlm_model_" + mockState.provider);
if (saved) {
  input.value     = saved;
  mockState.model = saved;
  demoOut.textContent = saved;
}