const FIXED_MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  anthropic: ['claude-sonnet-4-5', 'claude-haiku-4-5-20251001', 'claude-opus-4-5'],
};

const FETCH_ENDPOINTS = {
  openai: async (key) => {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return (data.data || [])
      .map((model) => model.id)
      .filter((id) => id.startsWith('gpt-'))
      .sort();
  },
  gemini: async (key) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return (data.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
      .map((model) => model.name.replace('models/', ''));
  },
  anthropic: async (key) => {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return (data.data || []).map((model) => model.id);
  },
};

const tw = {
  dropdown:
    'absolute left-0 right-0 top-[calc(100%+6px)] z-50 hidden max-h-[18rem] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-md',
  section:
    'border-t border-[var(--border-soft)] px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] first:border-t-0',
  option:
    'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm text-[var(--text)] transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[focused=true]:bg-gray-100 data-[focused=true]:text-gray-950',
  optionDark:
    'data-[focused=true]:bg-[var(--row-hover)] hover:bg-[var(--row-hover)] data-[focused=true]:text-[var(--text)]',
  optionName: 'min-w-0 flex-1 truncate',
  badge:
    'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase leading-none',
  apiBadge: 'border-blue-200 bg-blue-50 text-blue-700',
  defaultBadge: 'border-amber-200 bg-amber-50 text-amber-700',
  empty: 'px-3 py-3 text-sm italic text-[var(--text-muted)]',
  mark: 'rounded bg-transparent font-bold text-[var(--accent)]',
};

function normalizeItems(data, source = 'default') {
  return data.map((item) => (typeof item === 'string' ? { value: item, source } : item));
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return escapeHtml(text);

  return [
    escapeHtml(text.slice(0, index)),
    `<mark class="${tw.mark}">${escapeHtml(text.slice(index, index + query.length))}</mark>`,
    escapeHtml(text.slice(index + query.length)),
  ].join('');
}

export function setupAutocomplete(inputId, suggestionsId, data, options = {}) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(suggestionsId);
  const container = options.containerId
    ? document.getElementById(options.containerId)
    : input?.parentElement;

  if (!input || !dropdown) return null;

  dropdown.className = tw.dropdown;

  let items = normalizeItems(data);
  let focusedIndex = -1;
  let visibleOptions = [];

  function groupedItems(query) {
    const q = query.trim().toLowerCase();
    const filtered = q ? items.filter((item) => item.value.toLowerCase().includes(q)) : items;

    return filtered.reduce((groups, item) => {
      const source = item.source || 'default';
      if (!groups[source]) groups[source] = [];
      groups[source].push(item);
      return groups;
    }, {});
  }

  function close() {
    dropdown.classList.add('hidden');
    focusedIndex = -1;
    visibleOptions = [];
  }

  function select(value) {
    input.value = value;
    options.onInput?.(value);
    options.onSelect?.(value);
    window.dispatchEvent(new CustomEvent('jlm:modelChanged', { detail: { model: value } }));
    close();
  }

  function render() {
    const query = input.value;
    const groups = groupedItems(query);
    const groupEntries = Object.entries(groups);

    dropdown.innerHTML = '';
    visibleOptions = [];
    focusedIndex = -1;

    if (!groupEntries.length && query.trim()) {
      const empty = document.createElement('div');
      empty.className = tw.empty;
      empty.textContent = `No match - press Enter to use "${query}"`;
      dropdown.appendChild(empty);
      dropdown.classList.remove('hidden');
      return;
    }

    if (!groupEntries.length) {
      close();
      return;
    }

    groupEntries.forEach(([source, groupItems]) => {
      const section = document.createElement('div');
      section.className = tw.section;
      section.textContent = source === 'api' ? 'From API' : 'Suggestions';
      dropdown.appendChild(section);

      groupItems.forEach((item) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = `${tw.option} ${tw.optionDark}`;
        option.dataset.value = item.value;
        option.dataset.focused = 'false';
        option.setAttribute('role', 'option');

        const name = document.createElement('span');
        name.className = tw.optionName;
        name.innerHTML = query.trim()
          ? highlight(item.value, query.trim())
          : escapeHtml(item.value);

        const badge = document.createElement('span');
        badge.className = `${tw.badge} ${source === 'api' ? tw.apiBadge : tw.defaultBadge}`;
        badge.textContent = source === 'api' ? 'API' : 'default';

        option.append(name, badge);
        option.addEventListener('mousedown', (event) => {
          event.preventDefault();
          select(item.value);
        });

        dropdown.appendChild(option);
        visibleOptions.push(option);
      });
    });

    dropdown.classList.remove('hidden');
  }

  function moveFocus(direction) {
    if (!visibleOptions.length) return;

    visibleOptions.forEach((option) => {
      option.dataset.focused = 'false';
      option.setAttribute('aria-selected', 'false');
    });

    focusedIndex = (focusedIndex + direction + visibleOptions.length) % visibleOptions.length;
    const focused = visibleOptions[focusedIndex];
    focused.dataset.focused = 'true';
    focused.setAttribute('aria-selected', 'true');
    focused.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', render);
  input.addEventListener('input', () => {
    options.onInput?.(input.value);
    render();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(-1);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selectedOption = visibleOptions[focusedIndex];
      const value = selectedOption?.dataset.value || input.value.trim();
      if (value) select(value);
    }
    if (event.key === 'Escape') {
      close();
      input.blur();
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(close, 120);
  });

  document.addEventListener('mousedown', (event) => {
    if (!container?.contains(event.target)) close();
  });

  return {
    close,
    open: render,
    setData(nextData) {
      items = normalizeItems(nextData);
      render();
    },
    addData(nextData, source = 'api') {
      const incoming = normalizeItems(nextData, source);
      const incomingValues = new Set(incoming.map((item) => item.value));
      items = [...incoming, ...items.filter((item) => !incomingValues.has(item.value))];
      render();
    },
    getValue() {
      return input.value;
    },
    setValue(value) {
      input.value = value;
      options.onInput?.(value);
    },
  };
}

function setStatus(message, type = '') {
  const status = document.getElementById('acStatus');
  if (!status) return;

  const tone =
    type === 'ok'
      ? 'text-[var(--green)]'
      : type === 'err'
        ? 'text-[var(--red)]'
        : 'text-[var(--text-muted)]';

  status.className = `mt-2 text-xs ${tone}`;
  status.textContent = message;
}

export function initModelAutocomplete() {
  const provider = 'gemini';
  const input = document.getElementById('acInput');
  const fetchButton = document.getElementById('acFetchBtn');
  const fetchLabel = document.getElementById('acFetchLabel');
  const demoOutput = document.getElementById('demoOutput');

  const autocomplete = setupAutocomplete('acInput', 'acDropdown', FIXED_MODELS[provider], {
    containerId: 'acWrap',
    onInput(value) {
      if (demoOutput) demoOutput.textContent = value || '-';
    },
    onSelect(value) {
      localStorage.setItem(`jlm_model_${provider}`, value);
      setStatus('', '');
    },
  });

  window.addEventListener('jlm:apiModelsFetched', (event) => {
    if (!event?.detail?.models || !autocomplete) return;
    autocomplete.addData(event.detail.models, 'api');
    if (event.detail.models.length) {
      const acBadge = document.getElementById('acApiBadge');
      if (acBadge) acBadge.classList.remove('hidden');
      autocomplete.open();
      setStatus('', '');
    }
  });

  const saved = localStorage.getItem(`jlm_model_${provider}`);
  if (saved && autocomplete) {
    autocomplete.setValue(saved);
    window.dispatchEvent(new CustomEvent('jlm:modelChanged', { detail: { model: saved } }));
    if (demoOutput) demoOutput.textContent = saved;
  }

  fetchButton?.addEventListener('click', async () => {
    const key = prompt('Paste your API key to test fetch:');
    if (!key || !autocomplete) return;

    fetchButton.disabled = true;
    fetchButton.classList.add('opacity-50', 'cursor-not-allowed');
    fetchButton.querySelector('[data-ac-fetch-icon]')?.classList.add('animate-spin');
    if (fetchLabel) fetchLabel.textContent = '...';
    setStatus('Fetching models...', '');

    try {
      const models = await FETCH_ENDPOINTS[provider](key);
      autocomplete.addData(models, 'api');
      // Open the dropdown so the fetched API models are immediately visible
      autocomplete.open();
      // Show the API badge near the autocomplete input
      const acBadge = document.getElementById('acApiBadge');
      if (acBadge) acBadge.classList.remove('hidden');
      setStatus('', '');
      if (models.length) {
        window.dispatchEvent(new CustomEvent('jlm:modelChanged', { detail: { model: models[0] } }));
      }
      input?.focus();
    } catch (error) {
      setStatus(`Error: ${error.message}`, 'err');
      const acBadge = document.getElementById('acApiBadge');
      if (acBadge) acBadge.classList.add('hidden');
    } finally {
      fetchButton.disabled = false;
      fetchButton.classList.remove('opacity-50', 'cursor-not-allowed');
      fetchButton.querySelector('[data-ac-fetch-icon]')?.classList.remove('animate-spin');
      if (fetchLabel) fetchLabel.textContent = 'Fetch';
    }
  });
}
