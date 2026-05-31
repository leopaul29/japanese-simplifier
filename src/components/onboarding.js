const Onboarding = (() => {

// ── Step definitions ─────────────────────────────────────
// target: CSS selector of the element to spotlight (null = center screen)
// placement: where to put the tooltip relative to target
//   "bottom" | "top" | "left" | "right" | "center"
const STEPS = [
    {
    target: null,
    placement: "center",
    title: "Welcome to Japanese Level Mixer 🇯🇵",
    body: "This tool helps you read business Japanese at your own pace. You choose which expressions to simplify — the rest stays exactly as written. This quick tour takes 30 seconds.",
    },
    {
    target: "#card-settings",
    placement: "bottom",
    title: "Set up your API key",
    body: "Choose your AI provider — OpenAI, Gemini, or Anthropic — and paste your API key. The key is saved locally in your browser only and never sent anywhere except to the provider you choose. Gemini has a free tier.",
    },
    {
    target: "#typePills",
    placement: "bottom",
    title: "Choose the document type",
    body: "This gives the AI context. For example: in a resume 貴社 is correct, but in a spoken interview you should use 御社 instead. The tool will flag the wrong one automatically.",
    },
    {
    target: "#card-input",
    placement: "top",
    title: "Paste your Japanese text",
    body: "Paste any business Japanese text — a job posting, email, cover letter, or contract. Then click Analyze & Simplify. The AI will flag every expression worth knowing.",
    },
    {
    target: "#card-table",
    placement: "top",
    title: "Cherry-pick what to simplify",
    body: "Each flagged expression appears here with a simpler alternative and an English translation. Check only the ones you don't know — the result text updates live. Everything you know stays in its original form.",
    },
    {
    target: "#card-result",
    placement: "top",
    title: "Your personalized text",
    body: "Gold highlights = expressions you haven't replaced yet. Green highlights = expressions you've swapped. Click any highlight directly in the text to toggle it. Hit Copy when you're done.",
    },
];

// ── Internal state ───────────────────────────────────────
let current   = 0;
let active    = false;
let resizeTimer = null;

// ── DOM refs ─────────────────────────────────────────────
const overlay  = () => document.getElementById("ob-overlay");
const tooltip  = () => document.getElementById("ob-tooltip");
const ring     = () => document.getElementById("ob-ring");
const hole     = () => document.getElementById("ob-hole");
const backdrop = () => document.getElementById("ob-backdrop");

// ── Geometry helpers ─────────────────────────────────────
const PAD = 10; // spotlight padding around target

function getTargetRect(selector) {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
    x: r.left   - PAD,
    y: r.top    - PAD,
    w: r.width  + PAD * 2,
    h: r.height + PAD * 2,
    };
}

function positionTooltip(rect, placement) {
    const tip   = tooltip();
    const tipW  = 320;
    const tipH  = tip.offsetHeight || 200;
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;
    const margin = 14;
    let x, y;

    if (!rect || placement === "center") {
    x = (vw - tipW) / 2;
    y = (vh - tipH) / 2;
    } else if (placement === "bottom") {
    x = rect.x + rect.w / 2 - tipW / 2;
    y = rect.y + rect.h + margin;
    } else if (placement === "top") {
    x = rect.x + rect.w / 2 - tipW / 2;
    y = rect.y - tipH - margin;
    } else if (placement === "right") {
    x = rect.x + rect.w + margin;
    y = rect.y + rect.h / 2 - tipH / 2;
    } else if (placement === "left") {
    x = rect.x - tipW - margin;
    y = rect.y + rect.h / 2 - tipH / 2;
    }

    // Clamp to viewport
    x = Math.max(margin, Math.min(x, vw - tipW - margin));
    y = Math.max(margin, Math.min(y, vh - tipH - margin));

    tip.style.left = x + "px";
    tip.style.top  = y + "px";
}

function scrollTargetIntoView(selector) {
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top < 60 || r.bottom > vh - 60) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

// ── Render a step ────────────────────────────────────────
function renderStep(index, direction) {
    const step = STEPS[index];
    const rect = getTargetRect(step.target);

    // Scroll target into view first, then re-render geometry after scroll settles
    scrollTargetIntoView(step.target);

    // Update hole in SVG mask
    const h = hole();
    if (rect) {
    h.setAttribute("x",      rect.x);
    h.setAttribute("y",      rect.y);
    h.setAttribute("width",  rect.w);
    h.setAttribute("height", rect.h);
    } else {
    // No spotlight — hide hole
    h.setAttribute("width",  0);
    h.setAttribute("height", 0);
    }

    // Update highlight ring
    const r = ring();
    if (rect) {
    r.style.left   = rect.x + "px";
    r.style.top    = rect.y + "px";
    r.style.width  = rect.w + "px";
    r.style.height = rect.h + "px";
    r.classList.remove("hidden");
    } else {
    r.classList.add("hidden");
    }

    // Update tooltip content
    document.getElementById("ob-current").textContent = index + 1;
    document.getElementById("ob-total").textContent   = STEPS.length;
    document.getElementById("ob-title").textContent   = step.title;
    document.getElementById("ob-body").textContent    = step.body;

    // Prev/Next labels
    const prevBtn = document.getElementById("ob-prev");
    const nextBtn = document.getElementById("ob-next");
    prevBtn.style.display = index === 0 ? "none" : "inline-block";
    nextBtn.textContent   = index === STEPS.length - 1 ? "Got it ✓" : "Next →";

    // Progress dots
    const dots = document.getElementById("ob-dots");
    dots.innerHTML = "";
    STEPS.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "ob-dot" + (i === index ? " active" : "");
    dots.appendChild(d);
    });

    // Animate tooltip in
    const tip = tooltip();
    tip.classList.add("entering");
    tip.classList.remove("hidden");
    requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        tip.classList.remove("entering");
        // Position after content rendered
        positionTooltip(rect, step.placement);
    });
    });

    // Re-position after scroll settles (scroll changes getBoundingClientRect)
    setTimeout(() => {
    const freshRect = getTargetRect(step.target);
    if (freshRect) {
        h.setAttribute("x",      freshRect.x);
        h.setAttribute("y",      freshRect.y);
        h.setAttribute("width",  freshRect.w);
        h.setAttribute("height", freshRect.h);
        r.style.left   = freshRect.x + "px";
        r.style.top    = freshRect.y + "px";
        r.style.width  = freshRect.w + "px";
        r.style.height = freshRect.h + "px";
    }
    positionTooltip(freshRect || rect, step.placement);
    }, 380);
}

// ── Public API ───────────────────────────────────────────
function start() {
    current = 0;
    active  = true;

    overlay().classList.remove("hidden");
    overlay().style.opacity = "1";
    backdrop().style.display = "block";

    renderStep(0);

    // Handle resize
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
}

function end() {
    active = false;
    overlay().classList.add("hidden");
    tooltip().classList.add("hidden");
    ring().classList.add("hidden");
    backdrop().style.display = "none";
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll, true);
    localStorage.setItem("jlm_onboarding_done", "1");
}

function next() {
    if (current >= STEPS.length - 1) { end(); return; }
    current++;
    renderStep(current, "next");
}

function prev() {
    if (current <= 0) return;
    current--;
    renderStep(current, "prev");
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (active) renderStep(current); }, 100);
}

function onScroll() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (active) renderStep(current); }, 80);
}

// ── Auto-start on first visit ────────────────────────────
// Call this from your init() function:
//   if (!localStorage.getItem("jlm_onboarding_done")) Onboarding.start();
function autoStart() {
    if (!localStorage.getItem("jlm_onboarding_done")) start();
}

return { start, end, next, prev, autoStart };

})();

window.Onboarding = Onboarding;

// ── Keyboard navigation ──────────────────────────────────
document.addEventListener("keydown", e => {
if (!document.getElementById("ob-backdrop").style.display === "none") return;
if (e.key === "ArrowRight" || e.key === "Enter") Onboarding.next();
if (e.key === "ArrowLeft")                        Onboarding.prev();
if (e.key === "Escape")                           Onboarding.end();
});
