// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
const JLPT_LEVELS = ["N5","N4","N3","N2","N1"];
const TEXT_TYPES = [
  { id:"resume",  label:"📄 Resume / CV",       hint:"Written formal — 貴社 preferred, keigo expected" },
  { id:"email",   label:"✉️ Business Email",     hint:"Written semi-formal — flag overly stiff phrasing" },
  { id:"spoken",  label:"🎤 Speech / Interview", hint:"Spoken formal — 御社 preferred, flag written-only forms" },
  { id:"other",   label:"📝 Other",              hint:"General business Japanese" },
];
const PROVIDERS = {
  openai:    { name:"OpenAI",    models:["gpt-4o","gpt-4o-mini","gpt-4-turbo"], hint:'Get your key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>' },
  gemini:    { name:"Gemini",    models:["gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-flash","gemini-1.5-pro"], hint:'Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a> — free tier available' },
  anthropic: { name:"Anthropic", models:["claude-sonnet-4-5","claude-haiku-4-5-20251001"], hint:'Get your key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>' },
};

let state = {
  provider: "openai",
  apiKey: "",
  model: "",
  // myLevel: "N2",
  textType: "resume",
  substitutions: [],
  activeIds: new Set(),
  hasResult: false,
};

// ─────────────────────────────────────────
// Init
// ─────────────────────────────────────────
function init() {
  // Load saved prefs
  state.provider = localStorage.getItem("jlm_provider") || "openai";
  state.apiKey   = localStorage.getItem("jlm_key_" + state.provider) || "";
  // state.myLevel  = localStorage.getItem("jlm_level") || "N2";
  state.textType = localStorage.getItem("jlm_type") || "resume";
  const savedTheme = localStorage.getItem("jlm_theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);
  document.getElementById("themeBtn").textContent = savedTheme === "dark" ? "☀ Light" : "☾ Dark";

  const cp = localStorage.getItem("jlm_color_pending");
  const ca = localStorage.getItem("jlm_color_applied");
  if (cp) {
    document.documentElement.style.setProperty("--hl-pending-bg", cp);
    document.getElementById("colorPending").value = cp;
  }
  if (ca) {
    document.documentElement.style.setProperty("--hl-applied-bg", ca);
    document.getElementById("colorApplied").value = ca;
  }

  renderTypePills();
  // renderLevelPills();
  renderProviderUI();
  Onboarding.autoStart(); // shows only on first visit
}

// ─────────────────────────────────────────
// Theme
// ─────────────────────────────────────────
function toggleTheme() {
  const current = document.body.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  document.getElementById("themeBtn").textContent = next === "dark" ? "☀ Light" : "☾ Dark";
  localStorage.setItem("jlm_theme", next);
}

// ─────────────────────────────────────────
// Settings panel
// ─────────────────────────────────────────
function toggleSettings() {
  const body = document.getElementById("settingsBody");
  const arrow = document.getElementById("settingsArrow");
  const isHidden = body.classList.contains("hidden");
  body.classList.toggle("hidden", !isHidden);
  arrow.textContent = isHidden ? "▾" : "▸";
}

function selectProvider(p) {
  state.provider = p;
  localStorage.setItem("jlm_provider", p);
  state.apiKey = localStorage.getItem("jlm_key_" + p) || "";
  renderProviderUI();
}

function renderProviderUI() {
  // Pills
  Object.keys(PROVIDERS).forEach(p => {
    const el = document.getElementById("pill-" + p);
    if (el) el.classList.toggle("active", p === state.provider);
  });
  // Key input
  document.getElementById("apiKeyInput").value = state.apiKey;
  // Hint
  document.getElementById("apiHint").innerHTML = PROVIDERS[state.provider].hint;
  // Models
  const sel = document.getElementById("modelSelect");
  sel.innerHTML = "";
  const saved = localStorage.getItem("jlm_model_" + state.provider);
  PROVIDERS[state.provider].models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m; opt.textContent = m;
    if (m === saved) opt.selected = true;
    sel.appendChild(opt);
  });
  state.model = sel.value;
  updateSettingsStatus();
}

function saveApiKey() {
  state.apiKey = document.getElementById("apiKeyInput").value.trim();
  localStorage.setItem("jlm_key_" + state.provider, state.apiKey);
  updateSettingsStatus();
}

function saveModel() {
  state.model = document.getElementById("modelSelect").value;
  localStorage.setItem("jlm_model_" + state.provider, state.model);
}

function updateSettingsStatus() {
  const el = document.getElementById("settingsStatus");
  el.textContent = state.apiKey ? "✓ Key saved" : "⚠ No key";
  el.style.color = state.apiKey ? "var(--green)" : "var(--accent)";
}

function updateHighlightColor(type, color) {
  if (type === "pending") {
    document.documentElement.style.setProperty("--hl-pending-bg", color);
    localStorage.setItem("jlm_color_pending", color);
  } else {
    document.documentElement.style.setProperty("--hl-applied-bg", color);
    localStorage.setItem("jlm_color_applied", color);
  }
  // Re-render if results visible
  if (state.hasResult) renderHighlightedResult();
}

// ─────────────────────────────────────────
// Type pills
// ─────────────────────────────────────────
function renderTypePills() {
  const container = document.getElementById("typePills");
  container.innerHTML = "";
  TEXT_TYPES.forEach(t => {
    const btn = document.createElement("button");
    btn.className = "pill pill-blue" + (t.id === state.textType ? " active" : "");
    btn.textContent = t.label;
    btn.onclick = () => {
      state.textType = t.id;
      localStorage.setItem("jlm_type", t.id);
      renderTypePills();
      document.getElementById("typeHint").textContent =
        TEXT_TYPES.find(x => x.id === t.id)?.hint || "";
    };
    container.appendChild(btn);
  });
  document.getElementById("typeHint").textContent =
    TEXT_TYPES.find(x => x.id === state.textType)?.hint || "";
}

// ─────────────────────────────────────────
// Level pills
// ─────────────────────────────────────────
// function renderLevelPills() {
//   const container = document.getElementById("levelPills");
//   container.innerHTML = "";
//   JLPT_LEVELS.filter((_,i) => i > 0).forEach(l => {
//     const btn = document.createElement("button");
//     const simplerIdx = JLPT_LEVELS.indexOf(l) - 1;
//     const simpler = JLPT_LEVELS[simplerIdx];
//     btn.className = "pill pill-amber" + (l === state.myLevel ? " active" : "");
//     btn.textContent = l === state.myLevel ? `${l} → ${simpler}` : l;
//     btn.onclick = () => {
//       state.myLevel = l;
//       localStorage.setItem("jlm_level", l);
//       renderLevelPills();
//     };
//     container.appendChild(btn);
//   });
// }

// function getSimplerLevel() {
//   const idx = JLPT_LEVELS.indexOf(state.myLevel);
//   return JLPT_LEVELS[idx - 1] || "N3";
// }

// ─────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────
function buildPrompt() {
  const typeObj = TEXT_TYPES.find(t => t.id === state.textType) || TEXT_TYPES[3];
  return `You are a Japanese language coach helping a non-native speaker (non-native business Japanese reader level) read and write business Japanese more easily.

Document type: ${typeObj.label}
Context: ${typeObj.hint}

Your job: scan the text and flag EVERYTHING that could trip up a non-native speaker, even if they passed JLPT N2 or N1. Only flag an expression if you can provide a genuinely simpler alternative. If you cannot find a simpler everyday equivalent, do not flag it.

Flag all of the following:
- Keigo and formal business expressions (〜いたします、〜ございます、〜いただく、志望いたしました, etc.)
- Compound nouns made of kanji that are hard to parse (即戦力、大規模業務システム、精度、一貫して, etc.)
- Formal/written patterns that differ from spoken Japanese (〜において、〜に際し、〜を通じて, etc.)
- Any word or phrase where a simpler everyday equivalent exists
- Business/HR/corporate jargon (前職、担当、貢献、保有 used formally, etc.)
- Context-specific nuances: e.g. for spoken/interview contexts, flag 貴社 and suggest 御社; for written contexts, flag 御社 and suggest 貴社

Return ONLY lines in this exact pipe-delimited format, one expression per line, no header, no markdown, no extra text:
original|simplified|translation_en|note

Rules:
- original: exact substring copied VERBATIM from the input text
- simplified: simpler equivalent appropriate for the document type
- translation_en: English translation of original (max 6 words)
- note: what makes it hard (max 6 words) — be specific: "keigo humble form", "passive causative", "business HR jargon", "written-only pattern". Never write just "formal phrasing".
- Delimiter is | — never use | inside any field value
- Preserve grammatical context in simplified (particles, verb endings)
- Do not duplicate expressions
- If nothing to flag, output exactly: NONE

Do NOT flag:
- Words with no simpler alternative (original = simplified)
- Basic vocabulary (common everyday words, numbers, names, annotations like 注１)
- Foreign proper nouns and names
- Expressions that are already the simplest possible form

Example of good output:
志望いたしました|働きたいと思っています|I applied because I want|keigo humble verb form
即戦力|すぐ役立てる人|immediately useful hire|HR compound noun
日本語での業務コミュニケーションに支障はございません|日本語で仕事するのに問題ありません|no issues with Japanese at work|double keigo + formal negative

Example of what NOT to output (original = simplified, or no real simplification):
現代|現代|modern era|formal compound noun   ← WRONG, no simpler form exists
注１|注１|note 1|formal annotation          ← WRONG, it's an annotation not an expression
`;
}

// ─────────────────────────────────────────
// API calls
// ─────────────────────────────────────────
async function callOpenAI(prompt, text) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify({
      model: state.model,
      max_tokens: 2000,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `Text to analyze:\n${text}` },
      ],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "{}";
}

async function callGemini(prompt, text) {
  const model = state.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt }] },
      contents: [{ parts: [{ text: `Text to analyze:\n${text}` }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 }, // disable thinking — saves ~3000 tokens
      },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "NONE";
}

async function callAnthropic(prompt, text) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": state.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: state.model,
      max_tokens: 2000,
      system: prompt,
      messages: [{ role: "user", content: `Text to analyze:\n${text}` }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.content?.[0]?.text || "{}";
}

// ─────────────────────────────────────────
// Parse pipe-delimited CSV response
// ─────────────────────────────────────────
function parsePipeCSV(raw) {
  if (!raw || raw.trim() === "NONE") return [];
  return raw
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.includes("|") && !line.startsWith("original|")) // skip header if any
    .map((line, i) => {
      const parts = line.split("|");
      return {
        id: String(i + 1),
        original:       (parts[0] || "").trim(),
        simplified:     (parts[1] || "").trim(),
        translation_en: (parts[2] || "").trim(),
        explanation_en: (parts[3] || "").trim(),
      };
    })
    .filter(s => s.original && s.simplified);
}

// ─────────────────────────────────────────
// Models
// ─────────────────────────────────────────
async function fetchModels() {
  const btn    = document.getElementById("fetchModelsBtn");
  const status = document.getElementById("fetchModelsStatus");
  if (!state.apiKey) { status.textContent = "No API key set."; return; }

  btn.disabled = true;
  status.textContent = "Fetching…";

  const modelUrls = {
    openai: "https://api.openai.com/v1/models",
    gemini: `https://generativelanguage.googleapis.com/v1beta/models?key=${state.apiKey}`,
    anthropic: "https://api.anthropic.com/v1/models",
  };

  try {
    let models = [];

    if (state.provider === "gemini") {
      const res  = await fetch(modelUrls.gemini, {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      models = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
        .map(m => m.name.replace("models/", ""));

    } else if (state.provider === "openai") {
      const res  = await fetch(modelUrls.openai, {
        headers: { Authorization: `Bearer ${state.apiKey}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      models = (data.data || [])
        .map(m => m.id)
        .filter(id => id.startsWith("gpt-"))
        .sort();

    } else if (state.provider === "anthropic") {
      const res  = await fetch(modelUrls.anthropic, {
        headers: {
          "x-api-key": state.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      models = (data.data || []).map(m => m.id);
    }

    if (models.length === 0) throw new Error("No models returned");

    // Repopulate the select
    const sel   = document.getElementById("modelSelect");
    const current = sel.value;
    sel.innerHTML = "";
    models.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m; opt.textContent = m;
      if (m === current) opt.selected = true;
      sel.appendChild(opt);
    });
    // Keep first if previous selection gone
    state.model = sel.value;
    localStorage.setItem("jlm_model_" + state.provider, state.model);

    status.innerHTML = `<a href="${modelUrls[state.provider]}" target="_blank">✓ ${models.length} models loaded</a>`;
    status.style.color = "var(--green)";

  } catch (e) {
    status.textContent = "Error: " + e.message;
    status.style.color = "var(--red)";
  } finally {
    btn.disabled = false;
  }
}

// ─────────────────────────────────────────
// Main analyze
// ─────────────────────────────────────────
async function analyze() {
  const text = document.getElementById("inputText").value.trim();
  if (!text) return;

  if (!state.apiKey) {
    showError("Please enter your API key in the settings panel above.");
    toggleSettings(); // open settings
    return;
  }

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Analyzing…';
  hideError();

  state.substitutions = [];
  state.activeIds = new Set();
  state.hasResult = false;
  document.getElementById("card-result").classList.add("hidden");
  document.getElementById("card-table").classList.add("hidden");

  try {
    state.model = document.getElementById("modelSelect").value;
    const prompt = buildPrompt();
    let raw;

    if (state.provider === "openai")    raw = await callOpenAI(prompt, text);
    else if (state.provider === "gemini") raw = await callGemini(prompt, text);
    else                                raw = await callAnthropic(prompt, text);

    const clean = raw.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
    state.substitutions = parsePipeCSV(clean);
    state.hasResult = true;
    renderResults();
  } catch (e) {
    showError("Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Analyze & Simplify";
  }
}

// ─────────────────────────────────────────
// Apply substitutions
// ─────────────────────────────────────────
function applySubstitutions(text) {
  let result = text;
  const sorted = [...state.substitutions].sort((a,b) => b.original.length - a.original.length);
  sorted.forEach(sub => {
    if (state.activeIds.has(sub.id)) {
      result = result.split(sub.original).join(sub.simplified);
    }
  });
  return result;
}

// ─────────────────────────────────────────
// Render results
// ─────────────────────────────────────────
function renderHighlightedResult() {
  const text = document.getElementById("inputText").value;
  const box  = document.getElementById("resultBox");

  if (state.substitutions.length === 0) {
    box.textContent = text;
    return;
  }

  // Build a list of all spans to inject, sorted by position desc
  // so we can replace without offset issues
  const spans = [];
  state.substitutions.forEach(sub => {
    let idx = 0;
    while (true) {
      const pos = text.indexOf(sub.original, idx);
      if (pos === -1) break;
      spans.push({ pos, len: sub.original.length, sub });
      idx = pos + 1;
    }
  });

  // Sort by position desc to replace from end to start
  spans.sort((a, b) => b.pos - a.pos);

  // Deduplicate overlapping spans (keep longest)
  const clean = [];
  let lastStart = Infinity;
  for (const s of spans) {
    if (s.pos + s.len <= lastStart) {
      clean.push(s);
      lastStart = s.pos;
    }
  }

  // Build HTML
  let html = escHtml(text);
  // We work on the raw text (not escaped) to find positions,
  // then build HTML by splicing
  let result = "";
  let cursor = 0;
  const sorted = [...clean].sort((a, b) => a.pos - b.pos);

  for (const s of sorted) {
    result += escHtml(text.slice(cursor, s.pos));
    const isActive = state.activeIds.has(s.sub.id);
    const cls = isActive ? "hl-applied" : "hl-pending";
    const display = isActive ? escHtml(s.sub.simplified) : escHtml(s.sub.original);
    result += `<span class="${cls}" onclick="toggleRow('${s.sub.id}')" title="${escHtml(s.sub.translation_en)}">${display}</span>`;
    cursor = s.pos + s.len;
  }
  result += escHtml(text.slice(cursor));

  box.innerHTML = result.replace(/\n/g, "<br>");
}

function renderResults() {
  const text = document.getElementById("inputText").value;
  // const simpler = getSimplerLevel();

  // Result box
  renderHighlightedResult();
  updateBadge();
  document.getElementById("card-result").classList.remove("hidden");

  // Table
  document.getElementById("card-table").classList.remove("hidden");
  document.getElementById("colOriginal").textContent = `${state.myLevel} — original`;
  // document.getElementById("colSimpler").textContent  = `${simpler} — simpler`;

  const tbody = document.getElementById("subTableBody");
  tbody.innerHTML = "";

  const empty = document.getElementById("emptyMsg");

  if (state.substitutions.length === 0) {
    empty.classList.remove("hidden");
    document.getElementById("toggleAllBtn").classList.add("hidden");
  } else {
    empty.classList.add("hidden");
    document.getElementById("toggleAllBtn").classList.remove("hidden");
    state.substitutions.forEach(sub => {
      const tr = document.createElement("tr");
      tr.className = "sub-row";
      tr.dataset.id = sub.id;
      tr.onclick = () => toggleRow(sub.id);
      tr.innerHTML = `
        <td><div class="checkbox" id="cb-${sub.id}"></div></td>
        <td class="jp-cell">${escHtml(sub.original)}</td>
        <td class="simplified-cell">${escHtml(sub.simplified)}</td>
        <td class="translation-cell">${escHtml(sub.translation_en || "")}</td>
        <td class="note-cell">${escHtml(sub.explanation_en || "")}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Scroll to results
  document.getElementById("card-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateBadge() {
  const n = state.activeIds.size;
  document.getElementById("subBadge").textContent =
    `${n} substitution${n !== 1 ? "s" : ""} applied`;
  renderHighlightedResult();
}

// ─────────────────────────────────────────
// Toggle row
// ─────────────────────────────────────────
function toggleRow(id) {
  if (state.activeIds.has(id)) state.activeIds.delete(id);
  else state.activeIds.add(id);

  const tr = document.querySelector(`tr[data-id="${id}"]`);
  if (tr) tr.classList.toggle("active", state.activeIds.has(id));
  const cb = document.getElementById("cb-" + id);
  if (cb) cb.textContent = state.activeIds.has(id) ? "✓" : "";

  updateBadge();
  updateToggleAllBtn();
}

function toggleAll() {
  const allSelected = state.activeIds.size === state.substitutions.length;
  state.activeIds = allSelected ? new Set() : new Set(state.substitutions.map(s => s.id));

  state.substitutions.forEach(sub => {
    const tr = document.querySelector(`tr[data-id="${sub.id}"]`);
    if (tr) tr.classList.toggle("active", state.activeIds.has(sub.id));
    const cb = document.getElementById("cb-" + sub.id);
    if (cb) cb.textContent = state.activeIds.has(sub.id) ? "✓" : "";
  });

  updateBadge();
  updateToggleAllBtn();
}

function updateToggleAllBtn() {
  const btn = document.getElementById("toggleAllBtn");
  btn.textContent = state.activeIds.size === state.substitutions.length ? "Deselect all" : "Select all";
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
function updateCharCount() {
  const text = document.getElementById("inputText").value;
  const len = text.length;
  document.getElementById("charCount").textContent = `${len} chars`;
  // ~500 Japanese chars ≈ 1500 tokens input; warn above 600
  document.getElementById("charWarning").style.display = len > 600 ? "inline" : "none";
}

function copyResult() {
  const text = document.getElementById("resultBox").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(".copy-btn");
    btn.textContent = "Copied!";
    setTimeout(() => btn.textContent = "Copy", 1500);
  });
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError() {
  document.getElementById("errorMsg").classList.add("hidden");
}

function escHtml(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ─────────────────────────────────────────
// Boot
// ─────────────────────────────────────────
Object.assign(window, {
  analyze,
  copyResult,
  fetchModels,
  saveApiKey,
  saveModel,
  selectProvider,
  toggleAll,
  toggleRow,
  toggleSettings,
  toggleTheme,
  updateCharCount,
  updateHighlightColor,
});

init();
