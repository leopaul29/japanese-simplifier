import { useState, useCallback } from "react";

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"];

const TEXT_TYPES = [
  {
    id: "resume",
    label: "Resume / CV",
    icon: "📄",
    hint: "Written formal — 貴社 preferred over 御社, keigo expected",
  },
  {
    id: "email",
    label: "Business Email",
    icon: "✉️",
    hint: "Written semi-formal — flag overly stiff phrasing",
  },
  {
    id: "spoken",
    label: "Speech / Interview",
    icon: "🎤",
    hint: "Spoken formal — 御社 preferred over 貴社, flag written-only forms",
  },
  {
    id: "other",
    label: "Other",
    icon: "📝",
    hint: "General business Japanese",
  },
];

const SYSTEM_PROMPT = `You are a Japanese language coach helping a non-native speaker (JLPT {MY_LEVEL} level) read and write business Japanese more easily.

Document type: {TEXT_TYPE_LABEL}
Context: {TEXT_TYPE_HINT}

Your job: scan the text and flag EVERYTHING that could trip up a non-native speaker, even if they passed JLPT {MY_LEVEL}. Be generous and inclusive — it is better to flag too much than too little.

Flag all of the following:
- Keigo and formal business expressions (〜いたします、〜ございます、〜いただく、志望いたしました, etc.)
- Compound nouns made of kanji that are hard to parse (即戦力、大規模業務システム、精度、一貫して, etc.)
- Formal/written patterns that differ from spoken Japanese (〜において、〜に際し、〜を通じて, etc.)
- Any word or phrase where a simpler everyday equivalent exists
- Business/HR/corporate jargon (前職、担当、貢献、保有 used formally, etc.)
- Context-specific nuances: e.g. for spoken/interview contexts, flag 貴社 and suggest 御社; for written contexts, flag 御社 and suggest 貴社

For each flagged item, provide:
- The exact original substring from the text
- A simpler everyday Japanese equivalent that fits the document type context
- An English translation of the original expression
- A short English explanation of why it was flagged (register, formality level, context note)

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "substitutions": [
    {
      "id": "1",
      "original": "exact substring from the text",
      "simplified": "simpler equivalent appropriate for the document type",
      "translation_en": "English translation of the original expression",
      "explanation_en": "short explanation in English (max 10 words)"
    }
  ]
}

Rules:
- "original" must be copied VERBATIM from the input text — do not paraphrase or shorten it
- Preserve grammatical context in "simplified" (particles, verb endings)
- Do not duplicate — if an expression appears twice, list it once
- If truly nothing to flag, return {"substitutions": []}`;

function applySubstitutions(text, substitutions, activeIds) {
  let result = text;
  const sorted = [...substitutions].sort(
    (a, b) => b.original.length - a.original.length
  );
  sorted.forEach((sub) => {
    if (activeIds.has(sub.id)) {
      result = result.split(sub.original).join(sub.simplified);
    }
  });
  return result;
}

export default function JapaneseSimplifier() {
  const [inputText, setInputText] = useState("");
  const [myLevel, setMyLevel] = useState("N2");
  const [textType, setTextType] = useState("resume");
  const [substitutions, setSubstitutions] = useState([]);
  const [activeIds, setActiveIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasResult, setHasResult] = useState(false);

  // simpler level is always one step easier
  const simplerLevel = JLPT_LEVELS[JLPT_LEVELS.indexOf(myLevel) - 1] || "N3";

  const finalText = hasResult
    ? applySubstitutions(inputText, substitutions, activeIds)
    : "";

  const analyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setSubstitutions([]);
    setActiveIds(new Set());
    setHasResult(false);

    try {
      const typeObj = TEXT_TYPES.find((t) => t.id === textType) || TEXT_TYPES[3];
      const filledPrompt = SYSTEM_PROMPT
        .replaceAll("{MY_LEVEL}", myLevel)
        .replaceAll("{TEXT_TYPE_LABEL}", typeObj.label)
        .replaceAll("{TEXT_TYPE_HINT}", typeObj.hint);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: filledPrompt,
          messages: [
            {
              role: "user",
              content: `Text to analyze:\n${inputText}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const subs = parsed.substitutions || [];
      setSubstitutions(subs);
      setHasResult(true);
    } catch (e) {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [inputText, myLevel, textType]);

  const toggleRow = (id) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (activeIds.size === substitutions.length) {
      setActiveIds(new Set());
    } else {
      setActiveIds(new Set(substitutions.map((s) => s.id)));
    }
  };

  const fromIndex = JLPT_LEVELS.indexOf(myLevel);

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoMark}>日</div>
          <div>
            <h1 style={styles.title}>Japanese Level Mixer</h1>
            <p style={styles.subtitle}>
              Selectively simplify expressions to your comfort level
            </p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Input panel */}
        <section style={styles.card}>
          <label style={styles.label}>Your Japanese Text</label>
          <textarea
            style={styles.textarea}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ここにテキストを貼り付けてください…"
            rows={6}
          />

          {/* Text type selector */}
          <div style={styles.levelRow}>
            <div style={styles.levelGroup}>
              <label style={styles.smallLabel}>Document type</label>
              <div style={styles.levelPills}>
                {TEXT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    style={{
                      ...styles.pill,
                      ...(textType === t.id ? styles.pillActiveBlue : {}),
                    }}
                    onClick={() => setTextType(t.id)}
                    title={t.hint}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {textType && (
                <p style={styles.typeHint}>
                  {TEXT_TYPES.find((t) => t.id === textType)?.hint}
                </p>
              )}
            </div>
          </div>

          {/* Level selector */}
          <div style={styles.levelRow}>
            <div style={styles.levelGroup}>
              <label style={styles.smallLabel}>My JLPT level — find expressions at this level and offer simpler alternatives</label>
              <div style={styles.levelPills}>
                {JLPT_LEVELS.filter((l) => JLPT_LEVELS.indexOf(l) > 0).map((l) => (
                  <button
                    key={l}
                    style={{
                      ...styles.pill,
                      ...(myLevel === l ? styles.pillActive : {}),
                    }}
                    onClick={() => setMyLevel(l)}
                  >
                    {l}
                    {myLevel === l && (
                      <span style={styles.pillArrow}> → {JLPT_LEVELS[JLPT_LEVELS.indexOf(l) - 1]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            style={{
              ...styles.analyzeBtn,
              ...(loading ? styles.analyzeBtnLoading : {}),
            }}
            onClick={analyze}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <span style={styles.spinner}>◌ Analyzing…</span>
            ) : (
              "Analyze & Simplify"
            )}
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </section>

        {/* Results */}
        {hasResult && (
          <>
            {/* Final text */}
            <section style={styles.card}>
              <div style={styles.resultHeader}>
                <label style={styles.label}>Result Text</label>
                <span style={styles.badge}>
                  {activeIds.size} substitution
                  {activeIds.size !== 1 ? "s" : ""} applied
                </span>
              </div>
              <div style={styles.resultBox}>
                {finalText.split("\n").map((line, i) => (
                  <p key={i} style={styles.resultLine}>
                    {line || <br />}
                  </p>
                ))}
              </div>
              <button
                style={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(finalText)}
              >
                Copy
              </button>
            </section>

            {/* Substitutions table */}
            <section style={styles.card}>
              <div style={styles.resultHeader}>
                <label style={styles.label}>Substitutions</label>
                {substitutions.length > 0 && (
                  <button style={styles.toggleAllBtn} onClick={toggleAll}>
                    {activeIds.size === substitutions.length
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                )}
              </div>

              {substitutions.length === 0 ? (
                <p style={styles.emptyMsg}>
                  No {myLevel} expressions found — text looks accessible already 🎉
                </p>
              ) : (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: 40 }}></th>
                        <th style={styles.th}>{myLevel} — original</th>
                        <th style={styles.th}>{simplerLevel} — simpler</th>
                        <th style={styles.th}>Translation (EN)</th>
                        <th style={styles.th}>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {substitutions.map((sub) => {
                        const active = activeIds.has(sub.id);
                        return (
                          <tr
                            key={sub.id}
                            style={{
                              ...styles.tr,
                              ...(active ? styles.trActive : {}),
                            }}
                            onClick={() => toggleRow(sub.id)}
                          >
                            <td style={styles.td}>
                              <div
                                style={{
                                  ...styles.checkbox,
                                  ...(active ? styles.checkboxActive : {}),
                                }}
                              >
                                {active && "✓"}
                              </div>
                            </td>
                            <td style={{ ...styles.td, ...styles.jpCell }}>
                              {sub.original}
                            </td>
                            <td
                              style={{
                                ...styles.td,
                                ...styles.jpCell,
                                ...styles.simplified,
                              }}
                            >
                              {sub.simplified}
                            </td>
                            <td style={{ ...styles.td, ...styles.translationCell }}>
                              {sub.translation_en}
                            </td>
                            <td style={{ ...styles.td, ...styles.noteCell }}>
                              {sub.explanation_en}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Georgia', 'Noto Serif JP', serif",
    background: "#0f0e0c",
    minHeight: "100vh",
    color: "#e8e4dc",
  },
  header: {
    borderBottom: "1px solid #2a2820",
    padding: "20px 28px",
    background: "#141310",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    maxWidth: 860,
    margin: "0 auto",
  },
  logoMark: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#c8893a",
    background: "#1e1a14",
    border: "1px solid #3a3020",
    borderRadius: 8,
    width: 52,
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: "bold",
    color: "#f0e8d8",
    letterSpacing: "0.01em",
  },
  subtitle: {
    margin: "2px 0 0",
    fontSize: 13,
    color: "#7a7060",
  },
  main: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "#161411",
    border: "1px solid #2a2620",
    borderRadius: 10,
    padding: "20px 22px",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9a9080",
    marginBottom: 10,
  },
  textarea: {
    width: "100%",
    background: "#0f0e0c",
    border: "1px solid #2e2a22",
    borderRadius: 7,
    color: "#e8e4dc",
    fontSize: 16,
    lineHeight: 1.7,
    padding: "12px 14px",
    resize: "vertical",
    outline: "none",
    fontFamily: "'Georgia', 'Noto Serif JP', serif",
    boxSizing: "border-box",
  },
  levelRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    margin: "16px 0",
    flexWrap: "wrap",
  },
  levelGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  smallLabel: {
    fontSize: 11,
    color: "#7a7060",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  levelPills: {
    display: "flex",
    gap: 6,
  },
  pill: {
    padding: "5px 13px",
    borderRadius: 20,
    border: "1px solid #2e2a22",
    background: "#1a1710",
    color: "#9a8a70",
    fontSize: 13,
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  pillActive: {
    background: "#3a2a10",
    border: "1px solid #c8893a",
    color: "#c8893a",
  },
  pillActiveGreen: {
    background: "#0e2218",
    border: "1px solid #4a9a6a",
    color: "#4a9a6a",
  },
  pillActiveBlue: {
    background: "#0e1a2e",
    border: "1px solid #4a7ac8",
    color: "#4a7ac8",
  },
  typeHint: {
    margin: "6px 0 0",
    fontSize: 11,
    color: "#5a6070",
    fontStyle: "italic",
  },
  translationCell: {
    fontSize: 13,
    color: "#a09080",
    fontStyle: "italic",
  },
  arrowSep: {
    fontSize: 18,
    color: "#3a3020",
    marginTop: 18,
  },
  analyzeBtn: {
    background: "#c8893a",
    color: "#0f0e0c",
    border: "none",
    borderRadius: 7,
    padding: "11px 28px",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginTop: 4,
  },
  analyzeBtnLoading: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  spinner: {
    letterSpacing: "0.04em",
  },
  error: {
    color: "#c05040",
    fontSize: 13,
    marginTop: 10,
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badge: {
    fontSize: 12,
    color: "#4a9a6a",
    background: "#0e2218",
    border: "1px solid #1a4030",
    borderRadius: 12,
    padding: "3px 10px",
  },
  resultBox: {
    background: "#0f0e0c",
    border: "1px solid #2e2a22",
    borderRadius: 7,
    padding: "14px 16px",
    lineHeight: 1.9,
    fontSize: 16,
    fontFamily: "'Georgia', 'Noto Serif JP', serif",
    minHeight: 80,
  },
  resultLine: {
    margin: "0 0 4px",
  },
  copyBtn: {
    marginTop: 10,
    background: "transparent",
    border: "1px solid #2e2a22",
    color: "#7a7060",
    borderRadius: 6,
    padding: "5px 16px",
    fontSize: 12,
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
  emptyMsg: {
    color: "#7a9a70",
    fontSize: 14,
    fontStyle: "italic",
    padding: "12px 0",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "1px solid #2a2620",
    fontSize: 11,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#7a7060",
  },
  tr: {
    cursor: "pointer",
    transition: "background 0.1s",
    borderBottom: "1px solid #1e1c18",
  },
  trActive: {
    background: "#131f16",
  },
  td: {
    padding: "10px 12px",
    verticalAlign: "middle",
  },
  jpCell: {
    fontSize: 16,
    fontFamily: "'Georgia', 'Noto Serif JP', serif",
    color: "#d8d0c0",
  },
  simplified: {
    color: "#4a9a6a",
  },
  noteCell: {
    fontSize: 12,
    color: "#7a7060",
    fontStyle: "italic",
  },
  checkbox: {
    width: 20,
    height: 20,
    border: "1.5px solid #3a3020",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#4a9a6a",
    background: "#1a1710",
    transition: "all 0.1s",
  },
  checkboxActive: {
    background: "#0e2218",
    borderColor: "#4a9a6a",
  },
};
