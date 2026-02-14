import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./dashboard.css";

const STORAGE_KEYS = {
  tasks: "tasks_today_v1",
  currentUser: "currentUser",
  fallbackUser: "user",
};

const DEFAULT_TASKS = [
  { id: cryptoId(), text: "Revise: Time & Work", done: false },
  { id: cryptoId(), text: "Practice: 10 MCQs (Percentages)", done: false },
  { id: cryptoId(), text: "DSA: Arrays (Sliding Window)", done: false },
];

function cryptoId() {
  // CRA supports crypto in modern browsers
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).toString();
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeEmail(s) {
  return String(s || "").trim().toLowerCase();
}

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // ----------- Auth display -----------
  const [student, setStudent] = useState({ name: "Student", email: "" });

  useEffect(() => {
    const currentUser = safeParse(localStorage.getItem(STORAGE_KEYS.currentUser), null);
    const fallbackUser = safeParse(localStorage.getItem(STORAGE_KEYS.fallbackUser), null);

    const user =
      currentUser ||
      (fallbackUser?.email ? { name: "Student", email: fallbackUser.email } : null);

    if (!user) {
      navigate("/login");
      return;
    }

    setStudent({ name: user.name || "Student", email: user.email || "" });
  }, [navigate]);

  const onLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.fallbackUser);
    navigate("/login");
  };

  // ----------- Tasks -----------
  const [tasks, setTasks] = useState(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEYS.tasks), null);
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_TASKS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  const [query, setQuery] = useState("");
  const [newTask, setNewTask] = useState("");

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.text.toLowerCase().includes(q));
  }, [tasks, query]);

  const doneCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const totalCount = tasks.length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTasks((prev) => [{ id: cryptoId(), text, done: false }, ...prev]);
    setNewTask("");
  };

  const toggleTask = (taskId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ----------- Focus Timer (Pomodoro) -----------
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
      setRunning(false);
      alert("Focus session completed ✅ Take a short break!");
    }
  }, [running, secondsLeft]);

  const resetTimer = () => setSecondsLeft(25 * 60);

  // ----------- Metrics (demo; later from backend) -----------
  const metrics = useMemo(
    () => ({
      studyToday: "75 min",
      accuracy: "78%",
      streak: "5 days",
      weakArea: "Arrays (Sliding Window)",
    }),
    []
  );

  // ----------- Quick actions -----------
  const goPlanner = () => navigate("/planner");
  const goQuiz = () => navigate("/quiz");

  return (
    <div className="dash">
      <header className="dash__nav">
        <div className="dash__brand">AI Study Planner</div>

        <div className="dash__search">
          <input
            className="input input--dark"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="dash__user">
          <span className="dash__userText">
            {student.name} {student.email ? `• ${normalizeEmail(student.email)}` : ""}
          </span>
          <button className="btn btn--light" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dash__container">
        <section className="dash__hero">
          <div>
            <h1 className="dash__title">Dashboard</h1>
            <p className="dash__subtitle">
              Easy access: tasks, focus timer, and quick actions.
            </p>
          </div>

          <div className="dash__actions">
            <button className="btn btn--primary" onClick={goPlanner}>
              + Create Plan
            </button>
            <button className="btn btn--outline" onClick={goQuiz}>
              ▶ Start Quiz
            </button>
          </div>
        </section>

        <section className="dash__kpis">
          <Kpi title="Study Time (Today)" value={metrics.studyToday} hint="Daily consistency" />
          <Kpi title="Accuracy" value={metrics.accuracy} hint="Quiz performance" />
          <Kpi
            title="Tasks Done"
            value={`${doneCount}/${totalCount}`}
            hint={`${progressPct}% completed`}
          />
          <Kpi title="Streak" value={metrics.streak} hint="Keep it going" />
        </section>

        <section className="dash__grid">
          {/* Tasks */}
          <div className="panel">
            <div className="panel__head">
              <h3 className="panel__title">Today Tasks</h3>
              <span className="badge">{progressPct}%</span>
            </div>

            <div className="panel__add">
              <input
                className="input"
                placeholder="Add a task (example: DSA recursion practice)"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <button className="btn btn--dark" onClick={addTask}>
                Add
              </button>
            </div>

            <div className="progress">
              <div className="progress__bar" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="tasks">
              {filteredTasks.length === 0 ? (
                <div className="muted">No tasks found.</div>
              ) : (
                filteredTasks.map((t) => (
                  <div className="task" key={t.id}>
                    <button
                      className={`check ${t.done ? "check--on" : ""}`}
                      onClick={() => toggleTask(t.id)}
                      aria-label="toggle task"
                      type="button"
                    />
                    <button
                      className={`task__text ${t.done ? "task__text--done" : ""}`}
                      onClick={() => toggleTask(t.id)}
                      type="button"
                    >
                      {t.text}
                    </button>
                    <button
                      className="iconBtn"
                      onClick={() => deleteTask(t.id)}
                      aria-label="delete task"
                      type="button"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="muted small">Tip: Click a task to mark complete.</div>
          </div>

          {/* Focus + AI */}
          <div className="panel">
            <div className="panel__head">
              <h3 className="panel__title">Focus Timer</h3>
              <span className="badge badge--soft">Pomodoro</span>
            </div>

            <div className="timer">
              <div className="timer__time">{formatTime(secondsLeft)}</div>
              <div className="timer__buttons">
                <button className="btn btn--dark" onClick={() => setRunning((v) => !v)}>
                  {running ? "Pause" : "Start"}
                </button>
                <button className="btn btn--ghost" onClick={resetTimer}>
                  Reset
                </button>
              </div>
            </div>

            <div className="spacer" />

            <div className="panel__head">
              <h3 className="panel__title">AI Suggestions</h3>
              <span className="badge badge--soft">Useful</span>
            </div>

            <div className="pill">
              <b>Weak Area:</b> {metrics.weakArea}
            </div>
            <div className="pill">
              <b>Next Step:</b> Revise concept + solve 10 problems
            </div>
            <div className="pill">
              <b>Daily Goal:</b> 60 minutes 집중 study
            </div>

            <div className="btnRow">
              <button className="btn btn--ghost" onClick={() => alert("AI Explain (next)")}>
                ✨ AI Explain
              </button>
              <button className="btn btn--ghost" onClick={() => alert("Generate Quiz (next)")}>
                🧠 Generate Quiz
              </button>
            </div>
          </div>
        </section>

        <footer className="dash__footer">
          <Link to="/" className="link">← Back to Home</Link>
        </footer>
      </main>
    </div>
  );
}

function Kpi({ title, value, hint }) {
  return (
    <div className="kpi">
      <div className="kpi__title">{title}</div>
      <div className="kpi__value">{value}</div>
      <div className="kpi__hint">{hint}</div>
    </div>
  );
}
