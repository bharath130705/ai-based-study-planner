import React, { useEffect, useMemo, useState } from "react";
import "./analytics.css";

const STORAGE_KEY = "ai_study_plan_tasks_v1";
const LEGACY_STORAGE_KEY = "tasks";
const TASKS_UPDATED_EVENT = "ai-study-plan:tasks-updated";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeTasks(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((task) => task && typeof task.text === "string")
    .map((task) => ({
      text: task.text.trim(),
      time: Math.max(0, Number(task.time) || 0),
      done: Boolean(task.done),
      completedAt:
        task.done && typeof task.completedAt === "string" && !Number.isNaN(Date.parse(task.completedAt))
          ? task.completedAt
          : null,
    }))
    .filter((task) => task.text.length > 0);
}

function loadTasks() {
  const saved = normalizeTasks(safeParse(localStorage.getItem(STORAGE_KEY), []));
  if (saved.length > 0) return saved;
  return normalizeTasks(safeParse(localStorage.getItem(LEGACY_STORAGE_KEY), []));
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatClock(date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Analytics() {
  const [tasks, setTasks] = useState(loadTasks);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refreshTasks = () => setTasks(loadTasks());

    const handleStorage = (event) => {
      if (!event || event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) {
        refreshTasks();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(TASKS_UPDATED_EVENT, refreshTasks);

    const liveClockId = window.setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(TASKS_UPDATED_EVENT, refreshTasks);
      window.clearInterval(liveClockId);
    };
  }, []);

  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.time, 0);
  const completedMinutes = tasks.reduce((sum, task) => sum + (task.done ? task.time : 0), 0);
  const studyHours = (completedMinutes / 60).toFixed(1);
  const plannedHours = (totalMinutes / 60).toFixed(1);
  const accuracy = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const weeklyPerformance = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minutesByDate = tasks.reduce((accumulator, task) => {
      if (!task.done || !task.completedAt) return accumulator;

      const completedDate = new Date(task.completedAt);
      if (Number.isNaN(completedDate.getTime())) return accumulator;

      completedDate.setHours(0, 0, 0, 0);
      const key = toLocalDateKey(completedDate);
      accumulator[key] = (accumulator[key] || 0) + task.time;
      return accumulator;
    }, {});

    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const key = toLocalDateKey(day);

      days.push({
        key,
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: minutesByDate[key] || 0,
      });
    }

    const peakMinutes = Math.max(30, ...days.map((day) => day.minutes));

    return days.map((day) => ({
      ...day,
      heightPercent: day.minutes === 0 ? 8 : Math.max(16, Math.round((day.minutes / peakMinutes) * 100)),
    }));
  }, [tasks]);

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Study Analytics</h2>
        <span className="analytics-live">
          <span className="live-dot" />
          Live {formatClock(now)}
        </span>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Study Hours</h3>
          <p>{studyHours} hrs</p>
        </div>

        <div className="analytics-card">
          <h3>Plan Accuracy</h3>
          <p>{accuracy}%</p>
        </div>

        <div className="analytics-card">
          <h3>Completed Tasks</h3>
          <p>{completedTasks} / {totalTasks}</p>
        </div>

        <div className="analytics-card">
          <h3>Planned Hours</h3>
          <p>{plannedHours} hrs</p>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <p className="analytics-note">
        Overall progress: {progress}% | Updates automatically when tasks change.
      </p>

      <div className="weekly-chart">
        <h3>Weekly Performance</h3>
        <div className="bars">
          {weeklyPerformance.map((day) => (
            <div key={day.key} className="bar-wrap">
              <div
                className="bar"
                style={{ height: `${day.heightPercent}%` }}
                title={`${day.label}: ${day.minutes} mins`}
              />
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
