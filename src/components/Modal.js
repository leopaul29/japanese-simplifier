const modalHtml = `
<div id="settings-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div class="relative w-full max-w-3xl overflow-visible rounded-2xl bg-white text-slate-900 shadow-xl dark:bg-slate-950 dark:text-slate-100">
    <button id="close-modal" class="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:text-slate-100">✕</button>
    <div class="px-6 py-8 sm:px-8">
      <div class="mb-5 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold">Settings</h2>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-6">
        <aside class="w-full md:w-56 shrink-0 pr-6 border-r border-slate-100 dark:border-slate-800">
          <div>
            <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">Providers</div>
            <div class="mt-2 flex flex-col gap-1">
              <button type="button" class="menu-link flex items-center justify-between px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-900" data-target="panel-api" data-provider="gemini">
                <span>Gemini</span>
                <span class="provider-check text-slate-500 hidden">✓</span>
              </button>
            </div>
          </div>

          <div class="mt-6">
            <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">Others</div>
            <div class="mt-2 flex flex-col gap-1">
              <button class="menu-link text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900" data-target="panel-highlight">Highlight colors</button>
            </div>
          </div>
        </aside>

        <div class="flex-1">
          <div>
            <div id="panel-api">
              <div class="grid gap-5">
                <div>
                  <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">How to</div>
                  <div class="mt-2 text-sm text-slate-600 dark:text-slate-300 api-hint" id="apiHint">Get your free key at aistudio.google.com — free tier available</div>
                </div>

                <div>
                  <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">API Key</div>
                  <div class="mt-2 flex gap-2">
                    <input
                      id="apiKeyInput"
                      type="password"
                      class="api-input min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-800"
                      placeholder="Paste your API key here…"
                      oninput="saveApiKey()"
                    />
                    <button
                      id="fetchModelsBtn"
                      type="button"
                      onclick="fetchModels()"
                      class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 p-2 text-xs font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                    >
                      <span id="fetchModelsIcon">↻</span>
                    </button>
                  </div>
                  <div class="mt-2 text-xs text-slate-500 dark:text-slate-400" id="fetchModelsStatus"></div>
                </div>

                <div>
                  <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">Model <span class="ml-1 hidden rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200" id="acApiBadge">API</span></div>
                  <div id="acWrap" class="relative mt-2">
                    <div class="relative flex gap-2">
                      <input
                        id="acInput"
                        type="text"
                        autocomplete="off"
                        spellcheck="false"
                        class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-800"
                        placeholder="e.g. gemini-2.5-flash…"
                      />
                      <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">⌕</span>
                    </div>
                    <div id="acDropdown" role="listbox"></div>
                  </div>
                  <div id="acStatus" class="mt-2 text-xs text-slate-500 dark:text-slate-400"></div>
                </div>

              </div>
            </div>

            <div id="panel-highlight" class="hidden">
              <div>
                <div class="text-sm font-semibold text-slate-600 dark:text-slate-400">Highlight colors</div>
                <div class="mt-2 flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span id="previewPending" class="hl-pending rounded px-2 py-1">Not replaced</span>
                    <input type="color" id="colorPending" value="#b8860b" oninput="updateHighlightColor('pending', this.value)" />
                  </label>
                  <label class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span id="previewApplied" class="hl-applied rounded px-2 py-1">Replaced</span>
                    <input type="color" id="colorApplied" value="#2e7d52" oninput="updateHighlightColor('applied', this.value)" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

document.body.insertAdjacentHTML("beforeend", modalHtml);

const settingsModal = document.getElementById("settings-modal");
const settingsTrigger = document.getElementById("settingsTrigger");
const closeModalButton = document.getElementById("close-modal");

function openSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

settingsTrigger?.addEventListener("click", openSettingsModal);
closeModalButton?.addEventListener("click", closeSettingsModal);
settingsModal?.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    closeSettingsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsModal && !settingsModal.classList.contains("hidden")) {
    closeSettingsModal();
  }
});

// Menu / panel interaction
;(function setupSettingsMenu(){
  if (!settingsModal) return;
  const menuLinks = settingsModal.querySelectorAll('.menu-link');
  const panels = settingsModal.querySelectorAll('#panel-api, #panel-prompt, #panel-highlight');

  function showPanel(id){
    panels.forEach(p => { if (p.id === id) p.classList.remove('hidden'); else p.classList.add('hidden'); });
  }

  menuLinks.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.dataset.target;
      const provider = btn.dataset.provider;
      if (target) showPanel(target);
      if (provider && typeof window.selectProvider === 'function') window.selectProvider(provider);
      menuLinks.forEach(b => b.classList.remove('bg-slate-100','dark:bg-slate-900','font-semibold'));
      btn.classList.add('bg-slate-100','dark:bg-slate-900','font-semibold');
    });
  });

  function setActiveMenuButton(button){
    menuLinks.forEach(b => b.classList.remove('bg-slate-100','dark:bg-slate-900','font-semibold'));
    if (button) button.classList.add('bg-slate-100','dark:bg-slate-900','font-semibold');
  }

  menuLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const provider = btn.dataset.provider;
      if (target) showPanel(target);
      if (provider && typeof window.selectProvider === 'function') window.selectProvider(provider);
      setActiveMenuButton(btn);
    });
  });

  // initial state
  showPanel('panel-api');
  const firstMenu = settingsModal.querySelector('.menu-link');
  if (firstMenu) setActiveMenuButton(firstMenu);
})();
