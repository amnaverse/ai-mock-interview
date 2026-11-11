import { useState, useRef, useEffect } from "react";

const HISTORY_KEY = "mock-interview-history";

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

const saveHistory = (list) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // storage full or blocked: ignore
  }
};

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const ROLES = ["MERN Intern", "Frontend Developer", "Backend Developer", "Full Stack Developer"];
const LEVELS = ["easy", "medium", "hard"];
const TOTAL = 5;

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data;
}

// ---------- Style tokens ----------

const btnPrimary =
  "group inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-black transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(215,255,58,0.45)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none";

const btnGhost =
  "rounded-full border border-white/20 px-5 py-2 text-sm text-neutral-300 transition duration-300 hover:border-lime hover:text-lime active:scale-95";

const card =
  "rounded-2xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition duration-300 hover:border-lime/40";

const cardLift =
  "rounded-2xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-lime/60 hover:shadow-[0_0_40px_rgba(215,255,58,0.10)]";

const field =
  "rounded-full border border-white/15 bg-black px-4 py-3 text-sm text-white outline-none transition duration-300 hover:border-lime/60 focus:border-lime [&>option]:bg-neutral-900";

const Arrow = () => (
  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
);

function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${field} flex items-center gap-3`}
      >
        <span>{value}</span>
        <span className={`text-xs transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-20 mt-2 min-w-full overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 py-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
        >
          {options.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-colors duration-150 hover:bg-lime hover:text-black ${
                o === value ? "text-lime" : "text-neutral-200"
              }`}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState("setup"); // setup | question | summary
  const [role, setRole] = useState(ROLES[0]);
  const [difficulty, setDifficulty] = useState("easy");
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(loadHistory);

  const loadQuestion = async (previous) => {
    setLoading(true);
    setError("");
    setFeedback(null);
    setAnswer("");
    try {
      const data = await post("/api/question", { role, difficulty, previous });
      setQuestion(data.question);
      setAsked([...previous, data.question]);
      setStage("question");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const start = () => {
    setResults([]);
    setSummary(null);
    loadQuestion([]);
  };

  const submitAnswer = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await post("/api/feedback", { role, question, answer });
      setFeedback(data);
      setResults((prev) => [
        ...prev,
        { question, score: data.score, improvements: data.improvements },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    const avg = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const entry = {
      date: new Date().toISOString(),
      role,
      difficulty,
      average: Number(avg.toFixed(1)),
      count: results.length,
    };
    const nextHistory = [entry, ...history].slice(0, 10);
    setHistory(nextHistory);
    saveHistory(nextHistory);

    setLoading(true);
    setError("");
    try {
      setSummary(await post("/api/summary", { role, results }));
    } catch (e) {
      setSummary(null);
      setError(e.message);
    } finally {
      setLoading(false);
      setStage("summary");
    }
  };

  const restart = () => {
    setStage("setup");
    setQuestion("");
    setAsked([]);
    setFeedback(null);
    setResults([]);
    setSummary(null);
    setError("");
  };

  const isLast = asked.length >= TOTAL;
  const average = results.length
    ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1)
    : "0";

  return (
    <main className="bg-grid relative min-h-screen overflow-hidden bg-[#070707] px-4 py-12 text-white">
      {/* lime glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-160 -translate-x-1/2 rounded-full bg-lime/10 blur-[120px]" />

      <div className="relative mx-auto max-w-3xl space-y-8">
        {/* Title */}
        <header className="space-y-5">
          <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
            AI Mock
            <br />
            <span className="text-lime">Interview</span>
            <br />
            Coach.
          </h1>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-neutral-400">
            Practice. Get scored. Improve.
          </p>
        </header>

        {error && (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
            {error}
          </p>
        )}

        {/* SETUP */}
        {stage === "setup" && (
          <section className={`${card} fade-up space-y-6`}>
            <p className="text-neutral-300">
              Choose a role and difficulty. You get {TOTAL} questions, instant feedback on every
              answer, and a summary at the end.
            </p>

            <div className="flex flex-wrap gap-3">
             <Dropdown value={role} onChange={setRole} options={ROLES} />
<Dropdown value={difficulty} onChange={setDifficulty} options={LEVELS} />
              <button onClick={start} disabled={loading} className={btnPrimary}>
                {loading ? "Preparing..." : "Start interview"}
                <Arrow />
              </button>
            </div>

            {history.length > 0 && (
              <div className="space-y-3 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold uppercase">Past interviews</h2>
                  <button
                    onClick={() => {
                      setHistory([]);
                      saveHistory([]);
                    }}
                    className={btnGhost}
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-2 text-sm">
                  {history.map((h, i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-4 rounded-xl border border-white/5 bg-black/40 px-4 py-3 transition duration-300 hover:border-lime/40"
                    >
                      <span className="text-neutral-300">
                        {new Date(h.date).toLocaleDateString()} · {h.role} · {h.difficulty}
                      </span>
                      <span className="font-display font-bold text-lime">{h.average}/10</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* QUESTION */}
        {stage === "question" && (
          <>
            <div className="fade-up">
              <p className="mb-3 font-display text-sm uppercase tracking-widest text-neutral-400">
                Question <span className="text-lime">{asked.length}</span> / {TOTAL}
              </p>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className="h-1.5 rounded-full bg-lime shadow-[0_0_12px_rgba(215,255,58,0.8)] transition-all duration-500"
                  style={{ width: `${(results.length / TOTAL) * 100}%` }}
                />
              </div>
            </div>

            <section className={`${card} fade-up space-y-4`}>
              <p className="font-display text-xl font-bold leading-snug sm:text-2xl">{question}</p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                maxLength={2000}
                disabled={!!feedback}
                placeholder="Type your answer here..."
                className="w-full rounded-xl border border-white/15 bg-black p-4 text-white outline-none transition duration-300 placeholder:text-neutral-600 hover:border-lime/50 focus:border-lime disabled:opacity-60"
              />
              {!feedback && (
                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className={btnPrimary}
                >
                  {loading ? "Thinking..." : "Submit answer"}
                  <Arrow />
                </button>
              )}
            </section>

            {feedback && (
              <section className={`${cardLift} fade-up space-y-6`}>
                <div className="flex items-end gap-3">
                  <span className="font-display text-7xl font-bold leading-none text-lime">
                    {feedback.score}
                  </span>
                  <span className="pb-2 font-display text-xl text-neutral-500">/ 10</span>
                </div>

                <div>
                  <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-lime">
                    Strengths
                  </h2>
                  <ul className="list-disc space-y-1 pl-5 text-neutral-300 marker:text-lime">
                    {feedback.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-orange-400">
                    To improve
                  </h2>
                  <ul className="list-disc space-y-1 pl-5 text-neutral-300 marker:text-orange-400">
                    {feedback.improvements.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border-l-4 border-lime bg-black/50 p-4">
                  <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-widest">
                    Better answer
                  </h2>
                  <p className="text-neutral-300">{feedback.better_answer}</p>
                </div>

                {isLast ? (
                  <button onClick={finish} disabled={loading} className={btnPrimary}>
                    {loading ? "Preparing summary..." : "See summary"}
                    <Arrow />
                  </button>
                ) : (
                  <button onClick={() => loadQuestion(asked)} disabled={loading} className={btnPrimary}>
                    {loading ? "Loading..." : "Next question"}
                    <Arrow />
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {/* SUMMARY */}
        {stage === "summary" && (
          <section className={`${cardLift} fade-up space-y-6`}>
            <h2 className="font-display text-3xl font-bold uppercase">Interview summary</h2>

            <div>
              <div className="flex items-end gap-3">
                <span className="font-display text-7xl font-bold leading-none text-lime">{average}</span>
                <span className="pb-2 font-display text-xl text-neutral-500">/ 10</span>
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                Average score over {results.length} questions
              </p>
            </div>

            <ul className="space-y-2">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-4 rounded-xl border border-white/5 bg-black/40 px-4 py-3 transition duration-300 hover:border-lime/40"
                >
                  <span className="text-neutral-300">{r.question}</span>
                  <span className="font-display font-bold text-lime">{r.score}/10</span>
                </li>
              ))}
            </ul>

            {summary && (
              <>
                <p className="text-neutral-300">{summary.overall}</p>

                <div>
                  <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-orange-400">
                    Weak topics
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-neutral-300 marker:text-orange-400">
                    {summary.weak_topics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-lime">
                    Next steps
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-neutral-300 marker:text-lime">
                    {summary.next_steps.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <button onClick={restart} className={btnPrimary}>
              Practice again
              <Arrow />
            </button>
          </section>
        )}
      </div>
    </main>
  );
}