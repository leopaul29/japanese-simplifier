# 📜 agent.md - Translation Tool Project Instructions

## 🎯 **Context**
Project: Simple translation tool in **vanilla HTML/CSS/JS**.
Goal: Transform the project into an app with **Vite + Tailwind CSS + PurgeCSS**, with a **single-file build**.

---

## 📌 **Technical Requirements**
1. **Build System**:
   - Use **Vite** with `vite-plugin-singlefile` to generate **a single HTML file** (all inlined: CSS, JS, assets).
   - Integrate **Tailwind CSS** (local, no CDN) with **PurgeCSS** to remove unused classes.

2. **Project Structure**:
   ```
   /src
   ├── index.html          # Main HTML (navigation, autocomplete, modal)
   ├── main.js             # Entry point for JS
   ├── styles.css          # @tailwind base/components/utilities
   ├── components/
   │   ├── Autocomplete.js # Autocomplete logic (vanilla JS + Tailwind)
   │   └── Modal.js        # Modal for settings (triggered by a button in the navigation)
   └── utils/              # (Optional) Utility functions
   ```

3. **Features to Implement**:
   - **Autocomplete**:
     - Replace the current autocomplete with a **Tailwind-styled version**.
     - Filter suggestions in real-time.
     - Keyboard navigation (arrow keys + Enter).
   - **Settings Modal**:
     - Move the settings card into a **modal**.
     - Trigger button **next to the dark mode button** in the navigation.
     - Close via ✕, click outside, or `Escape` key.

4. **Constraints**:
   - **Vanilla JS only** (no frameworks).
   - **No unnecessary dependencies** (only Vite, Tailwind, PurgeCSS, `vite-plugin-singlefile`).
   - **Browser compatibility**: Works in Chrome/Firefox/Edge.
   - **Final build**: `dist/index.html` must be **standalone** (no server required).

---

## 🛠 **Minimal Required Configurations**
### `package.json` (devDependencies)
```json
{
  "devDependencies": {
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "vite-plugin-singlefile": "^0.13.5",
    "vite-plugin-purgecss": "^0.2.0"
  }
}
```

### `vite.config.js`
- Use `vite-plugin-singlefile` + `vite-plugin-purgecss`.
- Output: **Single HTML file** (`dist/index.html`).

### `tailwind.config.js`
- Scan `./src/**/*.{html,js}`.
- Purge unused classes in production.

---

## 📝 **Instructions for AI/Dev**
1. **Do not rewrite all the code**: Reuse the existing code and **adapt it**.
2. **Priorities**:
   - Configure Vite + Tailwind + PurgeCSS.
   - Integrate autocomplete and modal **without breaking existing features**.
3. **Deliverables**:
   - Folder/file structure (see above).
   - Config files (`vite.config.js`, `tailwind.config.js`, `postcss.config.js`).
   - Component code (`Autocomplete.js`, `Modal.js`).
   - Updated `index.html` with navigation + modal.

---
## 🚀 **Commands to Run**
```bash
npm install -D vite tailwindcss postcss autoprefixer vite-plugin-singlefile vite-plugin-purgecss
npm run dev    # Test locally
npm run build  # Generate dist/index.html
```
