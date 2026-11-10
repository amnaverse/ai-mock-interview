import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
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

const btn =
  "rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900 disabled:opacity-50";
const card = "space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5";
const field = "rounded-lg bg-slate-900 border border-slate-700 px-3 py-2";

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
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">AI Mock Interview Coach</h1>

        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-300">
            {error}
          </p>
        )}

        {stage === "setup" && (
          <section className={card}>
            <p className="text-slate-300">
              Choose a role and difficulty. You will get {TOTAL} questions and a summary at the end.
            </p>
            <div className="flex flex-wrap gap-3">
              <select value={role} onChange={(e) => setRole(e.target.value)} className={field}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={field}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
              <button onClick={start} disabled={loading} className={btn}>
                {loading ? "Preparing..." : "Start interview"}
              </button>
            </div>
          </section>
        )}

        {stage === "question" && (
          <>
            <div>
              <p className="mb-2 text-sm text-slate-400">
                Question {asked.length} of {TOTAL}
              </p>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-amber-500 transition-all"
                  style={{ width: `${(results.length / TOTAL) * 100}%` }}
                />
              </div>
            </div>

            <section className={card}>
              <p className="text-lg">{question}</p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                maxLength={2000}
                disabled={!!feedback}
                placeholder="Type your answer here..."
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-3 disabled:opacity-60"
              />
              {!feedback && (
                <button
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className={btn}
                >
                  {loading ? "Thinking..." : "Submit answer"}
                </button>
              )}
            </section>

            {feedback && (
              <section className={card}>
                <p className="text-2xl font-bold text-amber-400">Score: {feedback.score}/10</p>
                <div>
                  <h2 className="font-semibold text-green-400">Strengths</h2>
                  <ul className="list-disc pl-5">
                    {feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h2 className="font-semibold text-red-300">To improve</h2>
                  <ul className="list-disc pl-5">
                    {feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h2 className="font-semibold">Better answer</h2>
                  <p className="text-slate-300">{feedback.better_answer}</p>
                </div>
                {isLast ? (
                  <button onClick={finish} disabled={loading} className={btn}>
                    {loading ? "Preparing summary..." : "See summary"}
                  </button>
                ) : (
                  <button onClick={() => loadQuestion(asked)} disabled={loading} className={btn}>
                    {loading ? "Loading..." : "Next question"}
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {stage === "summary" && (
          <section className={card}>
            <h2 className="text-2xl font-bold">Interview summary</h2>
            <p className="text-4xl font-bold text-amber-400">{average}/10</p>
            <p className="text-sm text-slate-400">Average score over {results.length} questions</p>

            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-slate-800 pb-2">
                  <span className="text-slate-300">{r.question}</span>
                  <span className="font-semibold text-amber-400">{r.score}/10</span>
                </li>
              ))}
            </ul>

            {summary && (
              <>
                <p className="text-slate-300">{summary.overall}</p>
                <div>
                  <h3 className="font-semibold text-red-300">Weak topics</h3>
                  <ul className="list-disc pl-5">
                    {summary.weak_topics.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-green-400">Next steps</h3>
                  <ul className="list-disc pl-5">
                    {summary.next_steps.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              </>
            )}

            <button onClick={restart} className={btn}>Practice again</button>
          </section>
        )}
      </div>
    </main>
  );
}