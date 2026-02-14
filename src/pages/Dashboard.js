import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const STORAGE_KEYS = {
  subjects: "subjects",
  weakSubjects: "weakSubjects",
  studyPlan: "studyPlan",
};

const FEATURE_LINKS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "AI Study Plan", path: "/ai-study-plan" },
  { label: "Analytics", path: "/analytics" },
  { label: "AI Tutor", path: "/tutor" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TOPIC_BANK = {
  mathematics: [
    "Algebra",
    "Calculus",
    "Trigonometry",
    "Probability",
    "Statistics",
    "Linear Algebra",
    "Differential Equations",
  ],
  physics: [
    "Kinematics",
    "Newton's Laws",
    "Work and Energy",
    "Electrostatics",
    "Thermodynamics",
    "Magnetism",
    "Modern Physics",
  ],
  chemistry: [
    "Atomic Structure",
    "Bonding",
    "Organic Chemistry",
    "Electrochemistry",
    "Thermodynamics",
    "Periodic Table",
  ],
  biology: ["Cell Structure", "Genetics", "Physiology", "Evolution", "Ecology", "Biotechnology"],
  history: [
    "Ancient Civilizations",
    "World War I",
    "World War II",
    "Indian Freedom Struggle",
    "Modern History",
  ],
  geography: ["Climate", "Resources", "Human Geography", "Environmental Studies"],
  economics: ["Microeconomics", "Macroeconomics", "Inflation", "Banking", "Development"],
  english: ["Grammar", "Vocabulary", "Essay Writing", "Comprehension", "Poetry"],
  "computer science": ["Programming", "Data Structures", "Algorithms", "OS", "DBMS", "AI"],
};

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeSubjects(raw) {
  if (!Array.isArray(raw)) return [];

  const seen = new Set();
  return raw
    .map((subject) => String(subject || "").trim())
    .filter((subject) => {
      if (!subject) return false;
      const key = subject.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeWeakSubjects(raw, subjects) {
  if (!Array.isArray(raw)) return [];

  const allowed = new Set(subjects.map((subject) => subject.toLowerCase()));
  return raw
    .map((subject) => String(subject || "").trim())
    .filter((subject) => subject && allowed.has(subject.toLowerCase()));
}

function normalizeStudyPlan(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item.subject === "string" && typeof item.topic === "string")
    .map((item) => ({
      day: typeof item.day === "string" ? item.day : "Monday",
      subject: item.subject.trim(),
      topic: item.topic.trim(),
      duration: Math.max(15, Number(item.duration) || 60),
      completed: Boolean(item.completed),
    }))
    .filter((item) => item.subject && item.topic);
}

function calculateProgress(plan) {
  if (!Array.isArray(plan) || plan.length === 0) return 0;
  const completedCount = plan.filter((item) => item.completed).length;
  return Math.round((completedCount / plan.length) * 100);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [studyPlan, setStudyPlan] = useState([]);
  const [statusMessage, setStatusMessage] = useState(
    "Add subjects and generate a simple weekly plan."
  );
  const [liveNow, setLiveNow] = useState(() => new Date());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedSubjects = normalizeSubjects(safeParse(localStorage.getItem(STORAGE_KEYS.subjects), []));
    const savedPlan = normalizeStudyPlan(safeParse(localStorage.getItem(STORAGE_KEYS.studyPlan), []));
    const savedWeakSubjects = normalizeWeakSubjects(
      safeParse(localStorage.getItem(STORAGE_KEYS.weakSubjects), []),
      savedSubjects
    );

    setSubjects(savedSubjects);
    setStudyPlan(savedPlan);
    setWeakSubjects(savedWeakSubjects);
    setIsHydrated(true);

    const handleStorage = (event) => {
      if (
        !event ||
        event.key === STORAGE_KEYS.subjects ||
        event.key === STORAGE_KEYS.studyPlan ||
        event.key === STORAGE_KEYS.weakSubjects
      ) {
        const nextSubjects = normalizeSubjects(safeParse(localStorage.getItem(STORAGE_KEYS.subjects), []));
        const nextPlan = normalizeStudyPlan(safeParse(localStorage.getItem(STORAGE_KEYS.studyPlan), []));
        const nextWeakSubjects = normalizeWeakSubjects(
          safeParse(localStorage.getItem(STORAGE_KEYS.weakSubjects), []),
          nextSubjects
        );

        setSubjects(nextSubjects);
        setStudyPlan(nextPlan);
        setWeakSubjects(nextWeakSubjects);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.studyPlan, JSON.stringify(studyPlan));
    localStorage.setItem(STORAGE_KEYS.weakSubjects, JSON.stringify(weakSubjects));
  }, [subjects, weakSubjects, studyPlan, isHydrated]);

  useEffect(() => {
    setWeakSubjects((prev) => prev.filter((subject) => subjects.includes(subject)));
  }, [subjects]);

  useEffect(() => {
    const timerId = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const totalSessions = studyPlan.length;
  const completedSessions = useMemo(
    () => studyPlan.filter((item) => item.completed).length,
    [studyPlan]
  );
  const progress = useMemo(() => calculateProgress(studyPlan), [studyPlan]);
  const totalWeeklyMinutes = useMemo(
    () => studyPlan.reduce((total, item) => total + item.duration, 0),
    [studyPlan]
  );
  const totalWeeklyHours = useMemo(() => (totalWeeklyMinutes / 60).toFixed(1), [totalWeeklyMinutes]);

  const liveDate = liveNow.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const liveTime = liveNow.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const addSubject = () => {
    const cleanSubject = subjectInput.trim();
    if (!cleanSubject) return;

    const exists = subjects.some((subject) => subject.toLowerCase() === cleanSubject.toLowerCase());
    if (exists) {
      setStatusMessage(`"${cleanSubject}" is already in your list.`);
      return;
    }

    setSubjects((prev) => [...prev, cleanSubject]);
    setSubjectInput("");
    setStatusMessage(`Added ${cleanSubject}.`);
  };

  const removeSubject = (subjectToRemove) => {
    setSubjects((prev) => prev.filter((subject) => subject !== subjectToRemove));
    setWeakSubjects((prev) => prev.filter((subject) => subject !== subjectToRemove));
    setStudyPlan((prev) => prev.filter((entry) => entry.subject !== subjectToRemove));
    setStatusMessage(`Removed ${subjectToRemove}.`);
  };

  const toggleWeakSubject = (subject) => {
    setWeakSubjects((prev) => {
      if (prev.includes(subject)) {
        setStatusMessage(`${subject} removed from weak list.`);
        return prev.filter((entry) => entry !== subject);
      }

      setStatusMessage(`${subject} marked as weak.`);
      return [...prev, subject];
    });
  };

  const generateStudyPlan = () => {
    if (subjects.length === 0) {
      setStatusMessage("Add at least one subject before generating a plan.");
      return;
    }

    const newPlan = [];

    subjects.forEach((subject) => {
      const key = subject.toLowerCase();
      const topics =
        TOPIC_BANK[key] ||
        [
          `Introduction to ${subject}`,
          `${subject} Basics`,
          `${subject} Advanced Concepts`,
          `${subject} Practice`,
          `${subject} Mock Test`,
          `${subject} Revision`,
        ];

      const isWeak = weakSubjects.some((weakSubject) => weakSubject.toLowerCase() === subject.toLowerCase());
      const duration = isWeak ? 90 : 60;

      DAYS.forEach((day, index) => {
        newPlan.push({
          day,
          subject,
          topic: topics[index % topics.length],
          duration,
          completed: false,
        });
      });
    });

    setStudyPlan(newPlan);
    setStatusMessage(`Generated ${newPlan.length} sessions.`);
  };

  const clearPlan = () => {
    setStudyPlan([]);
    setStatusMessage("Plan cleared.");
  };

  const markComplete = (index) => {
    setStudyPlan((prev) =>
      prev.map((plan, itemIndex) => {
        if (itemIndex !== index) return plan;
        return { ...plan, completed: !plan.completed };
      })
    );
  };

  return (
    <div className="dashboard-container simple-dashboard">
      <aside className="sidebar">
        <h2>AI Planner</h2>
        <p className="simple-sidebar-time">{liveDate}</p>

        <ul className="sidebar-nav simple-sidebar-nav">
          {FEATURE_LINKS.map((feature) => (
            <li key={feature.path}>
              <button
                type="button"
                className={feature.path === "/dashboard" ? "active" : ""}
                onClick={() => navigate(feature.path)}
              >
                {feature.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content simple-main">
        <header className="simple-header">
          <div>
            <h1>Study Dashboard</h1>
            <p>Simple overview for subjects, weak areas, and weekly plan progress.</p>
          </div>
          <div className="simple-live-box">
            <span>Live</span>
            <strong>{liveTime}</strong>
          </div>
        </header>

        <div className="stats-grid simple-stats-grid">
          <div className="card simple-card">
            <h3>Progress</h3>
            <p>{progress}%</p>
          </div>
          <div className="card simple-card">
            <h3>Sessions</h3>
            <p>
              {completedSessions}/{totalSessions}
            </p>
          </div>
          <div className="card simple-card">
            <h3>Weekly Time</h3>
            <p>{totalWeeklyHours}h</p>
          </div>
          <div className="card simple-card">
            <h3>Weak Subjects</h3>
            <p>{weakSubjects.length}</p>
          </div>
        </div>

        <p className="simple-message">{statusMessage}</p>

        <section className="panel simple-panel">
          <h2>Subjects</h2>

          <div className="input-group simple-input-row">
            <input
              type="text"
              placeholder="Enter subject"
              value={subjectInput}
              onChange={(event) => setSubjectInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") addSubject();
              }}
            />
            <button type="button" onClick={addSubject}>
              Add
            </button>
          </div>

          <div className="simple-subject-list">
            {subjects.length === 0 && <p className="simple-empty">No subjects yet.</p>}
            {subjects.map((subject) => (
              <div key={subject} className="simple-subject-chip">
                <span>{subject}</span>
                <button type="button" onClick={() => removeSubject(subject)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="simple-weak-grid">
            {subjects.map((subject) => (
              <label key={`${subject}-weak`} className="simple-weak-item">
                <input
                  type="checkbox"
                  checked={weakSubjects.includes(subject)}
                  onChange={() => toggleWeakSubject(subject)}
                />
                <span>{subject}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel simple-panel">
          <div className="simple-plan-head">
            <h2>Weekly Plan</h2>
            <div className="simple-plan-actions">
              <button type="button" className="generate-btn" onClick={generateStudyPlan}>
                Generate Plan
              </button>
              <button type="button" className="simple-clear-btn" onClick={clearPlan} disabled={studyPlan.length === 0}>
                Clear
              </button>
            </div>
          </div>

          {studyPlan.length === 0 && <p className="simple-empty">No plan generated.</p>}

          {studyPlan.length > 0 && (
            <div className="simple-table-wrap">
              <table className="study-table simple-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studyPlan.map((plan, index) => (
                    <tr key={`${plan.subject}-${plan.day}-${index}`}>
                      <td>{plan.day}</td>
                      <td>{plan.subject}</td>
                      <td>{plan.topic}</td>
                      <td>{plan.duration} mins</td>
                      <td>{plan.completed ? "Done" : "Pending"}</td>
                      <td>
                        <button type="button" className="simple-table-btn" onClick={() => markComplete(index)}>
                          {plan.completed ? "Undo" : "Complete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
