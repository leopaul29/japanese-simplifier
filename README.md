# 🇯🇵 Japanese Level Mixer

A lightweight, privacy-first tool to help non-native Japanese speakers cherry-pick complex expressions from business Japanese texts and replace only the ones they don't know — keeping the rest intact.

Built for JLPT learners who receive business-level Japanese (keigo, compound nouns, formal patterns) and want to adapt it to their own reading comfort level, one expression at a time.

---

## ✨ Features

- Paste any Japanese text and select your JLPT level
- Choose the document type (Resume, Email, Interview, Other) for context-aware suggestions — e.g. 貴社 vs 御社
- Get a table of flagged expressions with simpler alternatives, English translations, and short notes
- **Cherry-pick** which expressions to replace — the final text updates live as you check/uncheck rows
- Light and dark mode
- Your settings and API key are saved locally between sessions

---

## 🔒 Privacy & Safety

**Your data never leaves your browser.**

- The tool is a single static HTML file with no backend, no server, no database
- Your API key is stored in your browser's `localStorage` only — it is never sent anywhere except directly to the AI provider you choose (OpenAI, Gemini, or Anthropic)
- No analytics, no tracking, no cookies
- You can inspect every line of the source code — there is nothing hidden

---

## 🚀 Getting Started

### Option 1 — Just open it locally

Download `japanese-level-mixer.html` and open it in any browser. That's it.

### Option 2 — Host it yourself

Drop the file on any static host (GitHub Pages, Netlify, Vercel, your own server). No build step needed.

### API Key setup

The tool supports three providers. A free tier is available with Gemini:

| Provider      | Free tier                 | Get your key                                                  |
| ------------- | ------------------------- | ------------------------------------------------------------- |
| **Gemini**    | ✅ Yes (gemini-1.5-flash) | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **OpenAI**    | ❌ Paid                   | [platform.openai.com](https://platform.openai.com/api-keys)   |
| **Anthropic** | ❌ Paid                   | [console.anthropic.com](https://console.anthropic.com)        |

Gemini's free tier is the recommended starting point if you just want to try the tool.

---

## 📄 License

**MIT License** — free to use, copy, modify, distribute, and build upon, for personal or commercial purposes, with no restrictions.

In plain terms: do whatever you want with it. Fork it, reskin it, embed it, ship it in your own product. No attribution required, though always appreciated.

---

## 🤝 Contributing

Contributions are very welcome. Some ideas if you want to pitch in:

- Support for more JLPT levels and finer-grained simplification
- Furigana display for flagged expressions
- Export the substitution table as CSV
- A reading mode that highlights flagged words inline in the original text
- Translations of the UI in Japanese, French, or other languages

To contribute: fork the repo, make your changes to `japanese-level-mixer.html`, and open a pull request. Since the whole project is one file, there is no build process to worry about.

---

## 🙏 Acknowledgements

Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.
AI analysis powered by your choice of OpenAI, Google Gemini, or Anthropic Claude.
