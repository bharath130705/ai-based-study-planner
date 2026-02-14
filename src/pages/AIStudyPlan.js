import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const STORAGE_KEY = "ai_study_plan_tasks_v1";
const LEGACY_STORAGE_KEY = "tasks";
const TASKS_UPDATED_EVENT = "ai-study-plan:tasks-updated";
const SUBJECT_DETAILS_KEY = "ai_study_plan_subject_details_v1";
const SUBJECT_QUEUE_KEY = "ai_study_plan_subject_queue_v1";
const ADVANCED_SETTINGS_KEY = "ai_study_plan_advanced_settings_v1";

const FEATURE_LINKS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "AI Study Plan", path: "/ai-study-plan" },
  { label: "Analytics", path: "/analytics" },
  { label: "AI Tutor", path: "/tutor" },
];

const DEFAULT_TASKS = [
  { text: "Physics Revision", time: 45, done: false, completedAt: null },
  { text: "Math Practice", time: 60, done: false, completedAt: null },
];

const STARTER_SUBJECTS = ["Math", "Science", "English", "Social Studies", "Computer Science"];

const DEFAULT_SUBJECT_DETAILS = {
  subject: "",
  level: "Intermediate",
  examDate: "",
  weakAreas: "",
  goal: "Exam Prep",
  dailyMinutes: "60",
};

const DEFAULT_ADVANCED_SETTINGS = {
  planDays: 7,
  studyDaysPerWeek: 6,
  dailyCapMinutes: 180,
  sessionMinutes: 45,
  breakMinutes: 10,
  includeRevisionDay: true,
  prioritizeWeakAreas: true,
};

const ADVANCED_PRESETS = {
  balanced: {
    label: "Balanced",
    values: {
      planDays: 14,
      studyDaysPerWeek: 6,
      dailyCapMinutes: 180,
      sessionMinutes: 45,
      breakMinutes: 10,
      includeRevisionDay: true,
      prioritizeWeakAreas: true,
    },
  },
  examSprint: {
    label: "Exam Sprint",
    values: {
      planDays: 7,
      studyDaysPerWeek: 7,
      dailyCapMinutes: 240,
      sessionMinutes: 50,
      breakMinutes: 10,
      includeRevisionDay: true,
      prioritizeWeakAreas: true,
    },
  },
  light: {
    label: "Light Routine",
    values: {
      planDays: 14,
      studyDaysPerWeek: 5,
      dailyCapMinutes: 120,
      sessionMinutes: 35,
      breakMinutes: 8,
      includeRevisionDay: false,
      prioritizeWeakAreas: false,
    },
  },
};

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
  const saved = safeParse(localStorage.getItem(STORAGE_KEY), null);
  const normalizedSaved = normalizeTasks(saved);
  if (normalizedSaved.length > 0) return normalizedSaved;

  const legacySaved = safeParse(localStorage.getItem(LEGACY_STORAGE_KEY), null);
  const normalizedLegacy = normalizeTasks(legacySaved);
  if (normalizedLegacy.length > 0) return normalizedLegacy;

  return DEFAULT_TASKS;
}

function normalizeSubjectDetails(raw) {
  if (!raw || typeof raw !== "object") return DEFAULT_SUBJECT_DETAILS;

  return {
    subject: typeof raw.subject === "string" ? raw.subject.trim() : "",
    level:
      raw.level === "Beginner" || raw.level === "Advanced" ? raw.level : "Intermediate",
    examDate: typeof raw.examDate === "string" ? raw.examDate : "",
    weakAreas: typeof raw.weakAreas === "string" ? raw.weakAreas.trim() : "",
    goal:
      raw.goal === "Homework" || raw.goal === "Revision" || raw.goal === "Concept Clarity"
        ? raw.goal
        : "Exam Prep",
    dailyMinutes: String(Math.max(0, Number(raw.dailyMinutes) || 0)) || "60",
  };
}

function loadSubjectDetails() {
  const saved = safeParse(localStorage.getItem(SUBJECT_DETAILS_KEY), null);
  return normalizeSubjectDetails(saved);
}

function normalizeSubjectQueue(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item.subject === "string")
    .map((item) => ({
      id: String(item.id || Date.now()),
      subject: item.subject.trim(),
      minutes: Math.max(0, Number(item.minutes) || 0),
      weakAreas: typeof item.weakAreas === "string" ? item.weakAreas.trim() : "",
    }))
    .filter((item) => item.subject.length > 0 && item.minutes > 0);
}

function loadSubjectQueue() {
  const saved = safeParse(localStorage.getItem(SUBJECT_QUEUE_KEY), []);
  return normalizeSubjectQueue(saved);
}

function normalizeAdvancedSettings(raw) {
  if (!raw || typeof raw !== "object") return DEFAULT_ADVANCED_SETTINGS;

  return {
    planDays: Math.min(30, Math.max(3, Number(raw.planDays) || 7)),
    studyDaysPerWeek: Math.min(7, Math.max(3, Number(raw.studyDaysPerWeek) || 6)),
    dailyCapMinutes: Math.min(420, Math.max(45, Number(raw.dailyCapMinutes) || 180)),
    sessionMinutes: Math.min(120, Math.max(20, Number(raw.sessionMinutes) || 45)),
    breakMinutes: Math.min(30, Math.max(0, Number(raw.breakMinutes) || 10)),
    includeRevisionDay:
      typeof raw.includeRevisionDay === "boolean" ? raw.includeRevisionDay : true,
    prioritizeWeakAreas:
      typeof raw.prioritizeWeakAreas === "boolean" ? raw.prioritizeWeakAreas : true,
  };
}

function loadAdvancedSettings() {
  const saved = safeParse(localStorage.getItem(ADVANCED_SETTINGS_KEY), null);
  return normalizeAdvancedSettings(saved);
}

function parseWeakAreas(value) {
  return value
    .split(",")
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);
}

function createAiStudyBlocks(topic, totalMinutes, details) {
  const cleanTopic = topic.trim();
  const minutes = Math.max(20, Number(totalMinutes) || 0);
  const weakAreas = parseWeakAreas(details.weakAreas || "");
  const focusWeakArea = weakAreas[0] || "";

  const templates =
    details.goal === "Exam Prep"
      ? [
          { label: "Concept Revision", ratio: 0.3 },
          {
            label: focusWeakArea ? `Weak Area Drill (${focusWeakArea})` : "Targeted Practice",
            ratio: 0.35,
          },
          { label: "Timed Questions", ratio: 0.2 },
          { label: "Quick Recap Quiz", ratio: 0.15 },
        ]
      : details.goal === "Homework"
      ? [
          { label: "Concept Warmup", ratio: 0.25 },
          { label: "Assignment Solving", ratio: 0.5 },
          { label: "Error Review", ratio: 0.25 },
        ]
      : minutes >= 120
      ? [
          { label: "Concept Revision", ratio: 0.35 },
          {
            label: focusWeakArea ? `Weak Area Drill (${focusWeakArea})` : "Problem Solving",
            ratio: 0.45,
          },
          { label: "Quick Recap Quiz", ratio: 0.2 },
        ]
      : minutes >= 60
      ? [
          { label: "Concept Revision", ratio: 0.45 },
          {
            label: focusWeakArea ? `Weak Area Drill (${focusWeakArea})` : "Problem Solving",
            ratio: 0.35,
          },
          { label: "Recap", ratio: 0.2 },
        ]
      : [
          { label: "Concept Revision", ratio: 0.55 },
          { label: focusWeakArea ? `Practice (${focusWeakArea})` : "Practice", ratio: 0.45 },
        ];

  let allocated = 0;
  const difficultyTag =
    details.level === "Beginner"
      ? "Foundation"
      : details.level === "Advanced"
      ? "Advanced"
      : "Core";

  return templates.map((slot, index) => {
    const remainingSlots = templates.length - index - 1;
    const rounded = Math.max(10, Math.round((minutes * slot.ratio) / 5) * 5);
    const maxAllowed = minutes - allocated - remainingSlots * 10;

    const time =
      index === templates.length - 1 ? minutes - allocated : Math.min(rounded, maxAllowed);

    allocated += time;

    return {
      text: `${cleanTopic} (${difficultyTag}): ${slot.label}`,
      time,
      done: false,
      completedAt: null,
    };
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function isStudyDay(date, studyDaysPerWeek) {
  if (studyDaysPerWeek >= 7) return true;

  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
  const allowed = new Set(weekdayOrder.slice(0, studyDaysPerWeek));
  return allowed.has(date.getDay());
}

function collectStudyDates(planDays, studyDaysPerWeek) {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let index = 0; index < planDays; index += 1) {
    const candidate = new Date(cursor);
    candidate.setDate(cursor.getDate() + index);
    if (isStudyDay(candidate, studyDaysPerWeek)) dates.push(candidate);
  }

  return dates;
}

function getExamUrgencyBoost(examDate) {
  if (!examDate) return 0;

  const exam = new Date(`${examDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays) || diffDays > 30) return 0;
  if (diffDays <= 7) return 0.45;
  if (diffDays <= 14) return 0.25;
  return 0.12;
}

function buildSessionLabel(subjectPool, prioritizeWeakAreas) {
  const cycle = ["Concept Revision", "Practice Questions", "Recall Quiz", "Past Paper Set"];

  if (prioritizeWeakAreas && subjectPool.weakAreas.length > 0 && subjectPool.sessionCount % 2 === 0) {
    const weakTopic = subjectPool.weakAreas[subjectPool.sessionCount % subjectPool.weakAreas.length];
    return `Weak Area Drill (${weakTopic})`;
  }

  return cycle[subjectPool.sessionCount % cycle.length];
}

function buildAdvancedSubjects(subjectQueue, subjectDetails) {
  if (subjectQueue.length > 0) {
    return subjectQueue.map((item) => ({
      subject: item.subject,
      minutes: item.minutes,
      weakAreas: parseWeakAreas(item.weakAreas),
    }));
  }

  if (!subjectDetails.subject.trim()) return [];

  return [
    {
      subject: subjectDetails.subject.trim(),
      minutes: Math.max(20, Number(subjectDetails.dailyMinutes) || 60),
      weakAreas: parseWeakAreas(subjectDetails.weakAreas || ""),
    },
  ];
}

function generateAdvancedStudySchedule(subjects, subjectDetails, settings) {
  const studyDates = collectStudyDates(settings.planDays, settings.studyDaysPerWeek);
  if (studyDates.length === 0 || subjects.length === 0) return [];

  const examBoost = getExamUrgencyBoost(subjectDetails.examDate);
  const planWeekMultiplier = Math.max(1, Math.round(settings.planDays / 7));

  const subjectPools = subjects.map((subject) => {
    const weakCount = subject.weakAreas.length;
    const levelBoost = subjectDetails.level === "Advanced" ? 0.12 : subjectDetails.level === "Beginner" ? -0.05 : 0;
    const weakBoost = settings.prioritizeWeakAreas ? weakCount * 0.1 : 0;

    return {
      ...subject,
      remainingMinutes: Math.max(settings.sessionMinutes, Math.round(subject.minutes * planWeekMultiplier)),
      priority: 1 + levelBoost + examBoost + weakBoost,
      sessionCount: 0,
    };
  });

  const generated = [];

  studyDates.forEach((date, dayIndex) => {
    let dayBudget = settings.dailyCapMinutes;
    let sessionsToday = 0;

    while (dayBudget >= Math.min(settings.sessionMinutes, 25)) {
      const nextSubject = subjectPools
        .filter((subject) => subject.remainingMinutes > 0)
        .sort((a, b) => b.remainingMinutes * b.priority - a.remainingMinutes * a.priority)[0];

      if (!nextSubject) break;

      const allocatedMinutes = Math.min(
        settings.sessionMinutes,
        dayBudget,
        nextSubject.remainingMinutes
      );

      if (allocatedMinutes < 20) break;

      const sessionLabel = buildSessionLabel(nextSubject, settings.prioritizeWeakAreas);

      generated.push({
        text: `${formatShortDate(date)} | ${nextSubject.subject}: ${sessionLabel}`,
        time: allocatedMinutes,
        done: false,
        completedAt: null,
      });

      nextSubject.remainingMinutes -= allocatedMinutes;
      nextSubject.sessionCount += 1;
      dayBudget -= allocatedMinutes;
      sessionsToday += 1;

      if (settings.breakMinutes > 0 && dayBudget > settings.breakMinutes + 20) {
        dayBudget -= settings.breakMinutes;
      }
    }

    if (settings.includeRevisionDay && dayIndex === studyDates.length - 1 && sessionsToday > 0) {
      generated.push({
        text: `${formatShortDate(date)} | Weekly Revision and Self Test`,
        time: Math.min(45, settings.sessionMinutes),
        done: false,
        completedAt: null,
      });
    }
  });

  return generated;
}

function buildAiRecommendation({
  examDaysRemaining,
  level,
  goal,
  weakAreaCount,
  subjectCount,
}) {
  if (examDaysRemaining !== null && examDaysRemaining <= 7) {
    return {
      mode: "Exam Sprint",
      reason: "Exam is very close, so shorter plan duration with higher daily focus is recommended.",
      action: ADVANCED_PRESETS.examSprint.values,
    };
  }

  if (level === "Beginner") {
    return {
      mode: "Foundation",
      reason: "Build concepts first with shorter sessions and fewer weekly study days.",
      action: ADVANCED_PRESETS.light.values,
    };
  }

  if (weakAreaCount >= 3) {
    return {
      mode: "Weak Topic Recovery",
      reason: "Multiple weak areas detected, so keep weak-area priority enabled and revision sessions active.",
      action: {
        ...ADVANCED_PRESETS.balanced.values,
        prioritizeWeakAreas: true,
        includeRevisionDay: true,
      },
    };
  }

  if (goal === "Homework") {
    return {
      mode: "Homework Balance",
      reason: "Distribute effort across the week with moderate session length to avoid overload.",
      action: {
        ...ADVANCED_PRESETS.balanced.values,
        sessionMinutes: 40,
      },
    };
  }

  if (subjectCount >= 5) {
    return {
      mode: "Multi Subject Balance",
      reason: "Many subjects in queue. Keep a balanced schedule with revision support.",
      action: ADVANCED_PRESETS.balanced.values,
    };
  }

  return {
    mode: "Balanced",
    reason: "Current setup looks stable for consistent progress.",
    action: ADVANCED_PRESETS.balanced.values,
  };
}

export default function AIStudyPlan() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(loadTasks);
  const [subjectDetails, setSubjectDetails] = useState(loadSubjectDetails);
  const [subjectQueue, setSubjectQueue] = useState(loadSubjectQueue);
  const [advancedSettings, setAdvancedSettings] = useState(loadAdvancedSettings);
  const [queueSubject, setQueueSubject] = useState("");
  const [queueMinutes, setQueueMinutes] = useState("60");
  const [queueWeakAreas, setQueueWeakAreas] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");
  const [liveNow, setLiveNow] = useState(() => new Date());
  const [focusTaskIndex, setFocusTaskIndex] = useState(-1);
  const [focusDurationMinutes, setFocusDurationMinutes] = useState("25");
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [aiMessage, setAiMessage] = useState(
    "Use single-subject AI Plan or Generate All Subjects for a complete schedule."
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(
      new CustomEvent(TASKS_UPDATED_EVENT, { detail: { updatedAt: Date.now() } })
    );
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(SUBJECT_DETAILS_KEY, JSON.stringify(subjectDetails));
  }, [subjectDetails]);

  useEffect(() => {
    localStorage.setItem(SUBJECT_QUEUE_KEY, JSON.stringify(subjectQueue));
  }, [subjectQueue]);

  useEffect(() => {
    localStorage.setItem(ADVANCED_SETTINGS_KEY, JSON.stringify(advancedSettings));
  }, [advancedSettings]);

  useEffect(() => {
    const timerId = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const completed = tasks.filter((task) => task.done).length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const weakAreaCount = useMemo(
    () => parseWeakAreas(subjectDetails.weakAreas).length,
    [subjectDetails.weakAreas]
  );
  const subjectsForPlanning = useMemo(
    () => buildAdvancedSubjects(subjectQueue, subjectDetails),
    [subjectQueue, subjectDetails]
  );

  const examDaysRemaining = useMemo(() => {
    if (!subjectDetails.examDate) return null;

    const today = new Date();
    const exam = new Date(`${subjectDetails.examDate}T00:00:00`);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (Number.isNaN(diff)) return null;
    return diff;
  }, [subjectDetails.examDate]);

  const examCountdown = useMemo(() => {
    if (examDaysRemaining === null) return "No exam date set";
    if (examDaysRemaining < 0) return "Exam date passed";
    if (examDaysRemaining === 0) return "Exam is today";
    return `${examDaysRemaining} day${examDaysRemaining === 1 ? "" : "s"} to exam`;
  }, [examDaysRemaining]);

  const dailySessionCount = useMemo(() => {
    const sessionLength = Math.max(20, Number(advancedSettings.sessionMinutes) || 45);
    const dailyCap = Math.max(sessionLength, Number(advancedSettings.dailyCapMinutes) || 180);
    return Math.max(1, Math.floor(dailyCap / sessionLength));
  }, [advancedSettings.dailyCapMinutes, advancedSettings.sessionMinutes]);

  const weeklyStudyHours = useMemo(() => {
    const weeklyMinutes =
      Math.max(0, Number(advancedSettings.dailyCapMinutes) || 0) *
      Math.max(0, Number(advancedSettings.studyDaysPerWeek) || 0);
    return (weeklyMinutes / 60).toFixed(1);
  }, [advancedSettings.dailyCapMinutes, advancedSettings.studyDaysPerWeek]);

  const focusDurationSeconds = useMemo(
    () => Math.max(5, Math.round(Number(focusDurationMinutes) || 25)) * 60,
    [focusDurationMinutes]
  );

  const liveClockLabel = useMemo(
    () =>
      liveNow.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [liveNow]
  );

  const activeFocusTask =
    focusTaskIndex >= 0 && focusTaskIndex < tasks.length ? tasks[focusTaskIndex] : null;
  const canResumeFocus =
    !focusRunning && focusSecondsLeft > 0 && focusSecondsLeft < focusDurationSeconds;

  useEffect(() => {
    if (tasks.length === 0) {
      setFocusTaskIndex(-1);
      setFocusRunning(false);
      return;
    }

    setFocusTaskIndex((current) => {
      if (current >= 0 && current < tasks.length) return current;
      const pendingIndex = tasks.findIndex((task) => !task.done);
      return pendingIndex >= 0 ? pendingIndex : 0;
    });
  }, [tasks]);

  useEffect(() => {
    if (focusRunning) return;
    if (focusSecondsLeft > 0 && focusSecondsLeft < focusDurationSeconds) return;
    setFocusSecondsLeft(focusDurationSeconds);
  }, [focusDurationSeconds, focusRunning, focusSecondsLeft]);

  useEffect(() => {
    if (!focusRunning) return undefined;

    const timerId = window.setInterval(() => {
      setFocusSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [focusRunning]);

  useEffect(() => {
    if (!focusRunning || focusSecondsLeft > 0) return;

    setFocusRunning(false);

    if (focusTaskIndex < 0 || !tasks[focusTaskIndex]) {
      setAiMessage("Focus session completed.");
      return;
    }

    const targetTask = tasks[focusTaskIndex];
    setTasks((prev) =>
      prev.map((task, index) => {
        if (index !== focusTaskIndex) return task;
        if (task.done) return task;
        return {
          ...task,
          done: true,
          completedAt: task.completedAt || new Date().toISOString(),
        };
      })
    );

    setAiMessage(`Focus session completed. Marked "${targetTask.text}" as done.`);
  }, [focusRunning, focusSecondsLeft, focusTaskIndex, tasks]);

  const aiRecommendation = useMemo(
    () =>
      buildAiRecommendation({
        examDaysRemaining,
        level: subjectDetails.level,
        goal: subjectDetails.goal,
        weakAreaCount,
        subjectCount: subjectsForPlanning.length,
      }),
    [
      examDaysRemaining,
      subjectDetails.level,
      subjectDetails.goal,
      weakAreaCount,
      subjectsForPlanning.length,
    ]
  );

  const updateSubjectField = (field, value) => {
    setSubjectDetails((prev) => ({ ...prev, [field]: value }));
  };

  const updateAdvancedField = (field, value) => {
    setAdvancedSettings((prev) => normalizeAdvancedSettings({ ...prev, [field]: value }));
  };

  const addSubjectToQueue = (subject, minutes, weakAreas = "") => {
    const cleanSubject = subject.trim();
    const parsedMinutes = Math.max(0, Math.round(Number(minutes) || 0));
    if (!cleanSubject || parsedMinutes <= 0) return false;

    setSubjectQueue((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        subject: cleanSubject,
        minutes: parsedMinutes,
        weakAreas: weakAreas.trim(),
      },
    ]);
    return true;
  };

  const addQueueDraftSubject = () => {
    const added = addSubjectToQueue(queueSubject, queueMinutes, queueWeakAreas);

    if (!added) {
      setAiMessage("Enter valid subject and minutes to add to all-subject plan.");
      return;
    }

    setQueueSubject("");
    setQueueMinutes("60");
    setQueueWeakAreas("");
    setAiMessage("Subject added to all-subject plan.");
  };

  const addCurrentDetailsToQueue = () => {
    const added = addSubjectToQueue(
      subjectDetails.subject,
      subjectDetails.dailyMinutes,
      subjectDetails.weakAreas
    );

    if (!added) {
      setAiMessage("Fill Subject and Daily Study Minutes first.");
      return;
    }

    setAiMessage("Current subject details added to all-subject plan.");
  };

  const loadStarterSubjects = () => {
    const baseMinutes = Math.max(20, Number(subjectDetails.dailyMinutes) || 60);

    setSubjectQueue((prev) => {
      const existing = new Set(prev.map((item) => item.subject.toLowerCase()));
      const additions = STARTER_SUBJECTS.filter((subject) => !existing.has(subject.toLowerCase())).map(
        (subject) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${subject}`,
          subject,
          minutes: baseMinutes,
          weakAreas: "",
        })
      );

      return [...prev, ...additions];
    });

    setAiMessage("Starter subjects added.");
  };

  const clearSubjectQueue = () => {
    setSubjectQueue([]);
    setAiMessage("All-subject list cleared.");
  };

  const removeQueueSubject = (id) => {
    setSubjectQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleTask = (index) => {
    setTasks((prev) =>
      prev.map((task, i) => {
        if (i !== index) return task;

        const done = !task.done;
        return {
          ...task,
          done,
          completedAt: done ? task.completedAt || new Date().toISOString() : null,
        };
      })
    );
  };

  const deleteTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const addTask = () => {
    const taskName = newTask.trim();
    const minutes = Number(newTime);

    if (!taskName || !Number.isFinite(minutes) || minutes <= 0) return;

    setTasks((prev) => [
      ...prev,
      { text: taskName, time: Math.round(minutes), done: false, completedAt: null },
    ]);
    setNewTask("");
    setNewTime("");
    setAiMessage("Task added.");
  };

  const addAiPlan = () => {
    const taskName = newTask.trim() || subjectDetails.subject.trim();
    const minutes = Number(newTime || subjectDetails.dailyMinutes);

    if (!taskName || !Number.isFinite(minutes) || minutes <= 0) {
      setAiMessage("Add subject details and valid minutes to generate AI plan.");
      return;
    }

    const aiTasks = createAiStudyBlocks(taskName, minutes, subjectDetails);
    setTasks((prev) => [...prev, ...aiTasks]);
    setNewTask("");
    setNewTime("");
    setAiMessage(
      `AI created ${aiTasks.length} blocks for ${taskName}. ${
        weakAreaCount > 0
          ? `Focused on ${weakAreaCount} weak area${weakAreaCount === 1 ? "" : "s"}.`
          : "Balanced full-topic plan generated."
      }`
    );
  };

  const generateAllSubjectsPlan = () => {
    if (subjectQueue.length === 0) {
      setAiMessage("Add subjects first, then generate all-subject plan.");
      return;
    }

    const generated = subjectQueue.flatMap((item) => {
      const mergedDetails = {
        ...subjectDetails,
        weakAreas: item.weakAreas || subjectDetails.weakAreas,
      };
      return createAiStudyBlocks(item.subject, item.minutes, mergedDetails);
    });

    setTasks((prev) => [...prev, ...generated]);
    setAiMessage(
      `AI created ${generated.length} blocks across ${subjectQueue.length} subject${
        subjectQueue.length === 1 ? "" : "s"
      }.`
    );
  };

  const generateAdvancedPlan = () => {
    const subjects = buildAdvancedSubjects(subjectQueue, subjectDetails);

    if (subjects.length === 0) {
      setAiMessage("Add at least one subject to generate advanced schedule.");
      return;
    }

    const generated = generateAdvancedStudySchedule(subjects, subjectDetails, advancedSettings);

    if (generated.length === 0) {
      setAiMessage("Unable to generate schedule with current settings. Adjust minutes or plan days.");
      return;
    }

    setTasks((prev) => [...prev, ...generated]);
    setAiMessage(
      `Advanced AI generated ${generated.length} sessions for ${subjects.length} subject${
        subjects.length === 1 ? "" : "s"
      } over ${advancedSettings.planDays} days.`
    );
  };

  const resetAdvancedSettings = () => {
    setAdvancedSettings(DEFAULT_ADVANCED_SETTINGS);
    setAiMessage("Advanced scheduler reset to recommended defaults.");
  };

  const applyAdvancedPreset = (presetKey) => {
    const preset = ADVANCED_PRESETS[presetKey];
    if (!preset) return;

    setAdvancedSettings(normalizeAdvancedSettings(preset.values));
    setAiMessage(`${preset.label} preset applied.`);
  };

  const applyAiRecommendationPreset = () => {
    setAdvancedSettings(normalizeAdvancedSettings(aiRecommendation.action));
    setAiMessage(`Applied AI recommendation: ${aiRecommendation.mode}.`);
  };

  const useSubjectDetails = () => {
    setNewTask(subjectDetails.subject);
    setNewTime(subjectDetails.dailyMinutes);
    setAiMessage("Loaded subject details into plan builder.");
  };

  const startFocusSession = () => {
    if (!activeFocusTask) {
      setAiMessage("Add or select a task to start focus mode.");
      return;
    }

    setFocusSecondsLeft(focusDurationSeconds);
    setFocusRunning(true);
    setAiMessage(`Focus mode started for "${activeFocusTask.text}".`);
  };

  const handleFocusPrimaryAction = () => {
    if (focusRunning) {
      setFocusRunning(false);
      setAiMessage("Focus session paused.");
      return;
    }

    if (canResumeFocus) {
      setFocusRunning(true);
      setAiMessage("Focus session resumed.");
      return;
    }

    startFocusSession();
  };

  const resetFocusSession = () => {
    setFocusRunning(false);
    setFocusSecondsLeft(focusDurationSeconds);
    setAiMessage("Focus timer reset.");
  };

  const handleLogout = () => {
    localStorage.removeItem("student");
    navigate("/");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>AI Planner</h2>
        <h3 className="sidebar-subtitle">Features</h3>
        <ul>
          {FEATURE_LINKS.map((feature) => (
            <li key={feature.label}>
              <button
                type="button"
                className={feature.path === "/ai-study-plan" ? "active" : ""}
                onClick={() => navigate(feature.path)}
              >
                {feature.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main">
        <div className="topbar pro-topbar">
          <div>
            <p className="eyebrow">AI Study Plan</p>
            <h1>AI Study Plan Builder</h1>
            <p className="topbar-note">Easy planning for all subjects with advanced AI scheduling.</p>
          </div>
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="stats">
          <div className="card">
            <h3>Plan Progress</h3>
            <p>{progress}%</p>
          </div>
          <div className="card">
            <h3>Completed</h3>
            <p>
              {completed}/{total}
            </p>
          </div>
          <div className="card">
            <h3>Subjects</h3>
            <p>{subjectsForPlanning.length}</p>
            <span className="card-hint">Included in AI generator</span>
          </div>
          <div className="card">
            <h3>Weak Topics</h3>
            <p>{weakAreaCount}</p>
            <span className="card-hint">From current subject details</span>
          </div>
          <div className="card">
            <h3>Daily Sessions</h3>
            <p>{dailySessionCount}</p>
            <span className="card-hint">About {weeklyStudyHours} hours/week</span>
          </div>
        </div>

        <section className="panel realtime-panel">
          <div className="realtime-header">
            <div>
              <p className="eyebrow">Real-Time Experience</p>
              <h2>Live Focus Session</h2>
            </div>
            <span className="subject-chip">{liveClockLabel}</span>
          </div>

          <div className="realtime-grid">
            <article className="realtime-card">
              <h4>Current Task</h4>
              <p>{activeFocusTask ? activeFocusTask.text : "No task selected"}</p>
              <span>{focusRunning ? "Session running now" : "Waiting to start"}</span>
            </article>
            <article className="realtime-card">
              <h4>Countdown</h4>
              <p className="realtime-countdown">{formatCountdown(focusSecondsLeft)}</p>
              <span>{focusRunning ? "Live" : canResumeFocus ? "Paused" : "Ready"}</span>
            </article>
          </div>

          <div className="realtime-controls">
            <select
              value={focusTaskIndex}
              onChange={(event) => {
                const nextIndex = Number(event.target.value);
                setFocusTaskIndex(Number.isNaN(nextIndex) ? -1 : nextIndex);
              }}
            >
              <option value={-1}>Select task for focus mode</option>
              {tasks.map((task, index) => (
                <option key={`${task.text}-${index}`} value={index}>
                  {task.done ? "[Done] " : ""}
                  {task.text}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="5"
              placeholder="Focus minutes"
              value={focusDurationMinutes}
              onChange={(event) => setFocusDurationMinutes(event.target.value)}
            />
            <button type="button" onClick={handleFocusPrimaryAction}>
              {focusRunning ? "Pause" : canResumeFocus ? "Resume" : "Start Focus"}
            </button>
            <button type="button" className="ghost-btn" onClick={resetFocusSession}>
              Reset
            </button>
          </div>
        </section>

        <section className="panel subject-details-panel">
          <div className="subject-details-header">
            <div>
              <p className="eyebrow">AI Context</p>
              <h2>Subject Details</h2>
            </div>
            <span className="subject-chip">{examCountdown}</span>
          </div>

          <div className="subject-details-grid">
            <label className="subject-field">
              <span>Subject</span>
              <input
                type="text"
                placeholder="e.g., Physics"
                value={subjectDetails.subject}
                onChange={(event) => updateSubjectField("subject", event.target.value)}
              />
            </label>

            <label className="subject-field">
              <span>Level</span>
              <select
                value={subjectDetails.level}
                onChange={(event) => updateSubjectField("level", event.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>

            <label className="subject-field">
              <span>Goal</span>
              <select
                value={subjectDetails.goal}
                onChange={(event) => updateSubjectField("goal", event.target.value)}
              >
                <option value="Exam Prep">Exam Prep</option>
                <option value="Homework">Homework</option>
                <option value="Revision">Revision</option>
                <option value="Concept Clarity">Concept Clarity</option>
              </select>
            </label>

            <label className="subject-field">
              <span>Exam Date</span>
              <input
                type="date"
                value={subjectDetails.examDate}
                onChange={(event) => updateSubjectField("examDate", event.target.value)}
              />
            </label>

            <label className="subject-field">
              <span>Daily Study Minutes</span>
              <input
                type="number"
                min="0"
                placeholder="60"
                value={subjectDetails.dailyMinutes}
                onChange={(event) => updateSubjectField("dailyMinutes", event.target.value)}
              />
            </label>

            <label className="subject-field subject-field-wide">
              <span>Weak Areas (comma separated)</span>
              <input
                type="text"
                placeholder="e.g., Electrostatics, Vectors"
                value={subjectDetails.weakAreas}
                onChange={(event) => updateSubjectField("weakAreas", event.target.value)}
              />
            </label>
          </div>

          <p className="subject-details-note">
            AI will prioritize {subjectDetails.goal.toLowerCase()} plans at {subjectDetails.level.toLowerCase()} level.
          </p>
        </section>

        <section className="panel subject-queue-panel">
          <div className="subject-queue-header">
            <div>
              <p className="eyebrow">All Subjects</p>
              <h2>Generate Plan for All Subjects</h2>
            </div>
            <div className="subject-queue-actions">
              <button type="button" className="ghost-btn" onClick={loadStarterSubjects}>
                Add Starter Subjects
              </button>
              <button type="button" className="ghost-btn" onClick={addCurrentDetailsToQueue}>
                Add From Details
              </button>
              <button type="button" className="ghost-btn danger" onClick={clearSubjectQueue}>
                Clear
              </button>
              <button type="button" className="logout" onClick={generateAllSubjectsPlan}>
                Generate All
              </button>
            </div>
          </div>

          <div className="subject-queue-form">
            <input
              type="text"
              placeholder="Subject (e.g., Math)"
              value={queueSubject}
              onChange={(event) => setQueueSubject(event.target.value)}
            />
            <input
              type="number"
              min="0"
              placeholder="Minutes"
              value={queueMinutes}
              onChange={(event) => setQueueMinutes(event.target.value)}
            />
            <input
              type="text"
              placeholder="Weak areas (optional)"
              value={queueWeakAreas}
              onChange={(event) => setQueueWeakAreas(event.target.value)}
            />
            <button type="button" onClick={addQueueDraftSubject}>
              Add Subject
            </button>
          </div>
          <p className="subject-queue-tip">
            Tip: add weak areas per subject so AI can create targeted blocks for each one.
          </p>

          <div className="subject-queue-list">
            {subjectQueue.length === 0 && (
              <p className="planner-empty">No subjects yet. Add subjects to generate all-subject AI plan.</p>
            )}
            {subjectQueue.map((item) => (
              <article key={item.id} className="subject-queue-item">
                <div>
                  <p className="subject-queue-title">{item.subject}</p>
                  <p className="subject-queue-meta">
                    {item.minutes} mins
                    {item.weakAreas && ` | ${item.weakAreas}`}
                  </p>
                </div>
                <button type="button" className="text-danger" onClick={() => removeQueueSubject(item.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel advanced-ai-panel">
          <div className="advanced-ai-header">
            <div>
              <p className="eyebrow">Advanced AI Generator</p>
              <h2>Smart Study Scheduler</h2>
            </div>
            <div className="subject-queue-actions">
              <button type="button" className="ghost-btn" onClick={applyAiRecommendationPreset}>
                Apply AI Recommendation
              </button>
              <button type="button" className="ghost-btn" onClick={resetAdvancedSettings}>
                Reset Settings
              </button>
              <button type="button" className="logout" onClick={generateAdvancedPlan}>
                Generate Smart Schedule
              </button>
            </div>
          </div>

          <div className="preset-row">
            <span className="preset-label">Quick presets</span>
            <div className="preset-chips">
              <button type="button" className="preset-chip" onClick={() => applyAdvancedPreset("balanced")}>
                Balanced
              </button>
              <button type="button" className="preset-chip" onClick={() => applyAdvancedPreset("examSprint")}>
                Exam Sprint
              </button>
              <button type="button" className="preset-chip" onClick={() => applyAdvancedPreset("light")}>
                Light Routine
              </button>
            </div>
          </div>

          <div className="advanced-grid">
            <label className="advanced-field">
              <span>Plan Duration</span>
              <select
                value={advancedSettings.planDays}
                onChange={(event) => updateAdvancedField("planDays", Number(event.target.value))}
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={21}>21 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </label>

            <label className="advanced-field">
              <span>Study Days / Week</span>
              <select
                value={advancedSettings.studyDaysPerWeek}
                onChange={(event) =>
                  updateAdvancedField("studyDaysPerWeek", Number(event.target.value))
                }
              >
                <option value={4}>4 Days</option>
                <option value={5}>5 Days</option>
                <option value={6}>6 Days</option>
                <option value={7}>7 Days</option>
              </select>
            </label>

            <label className="advanced-field">
              <span>Daily Time Cap (mins)</span>
              <input
                type="number"
                min="45"
                value={advancedSettings.dailyCapMinutes}
                onChange={(event) => updateAdvancedField("dailyCapMinutes", Number(event.target.value))}
              />
            </label>

            <label className="advanced-field">
              <span>Session Length (mins)</span>
              <input
                type="number"
                min="20"
                value={advancedSettings.sessionMinutes}
                onChange={(event) => updateAdvancedField("sessionMinutes", Number(event.target.value))}
              />
            </label>

            <label className="advanced-field">
              <span>Break Between Sessions (mins)</span>
              <input
                type="number"
                min="0"
                value={advancedSettings.breakMinutes}
                onChange={(event) => updateAdvancedField("breakMinutes", Number(event.target.value))}
              />
            </label>

            <label className="advanced-toggle">
              <input
                type="checkbox"
                checked={advancedSettings.includeRevisionDay}
                onChange={(event) => updateAdvancedField("includeRevisionDay", event.target.checked)}
              />
              Include weekly revision session
            </label>

            <label className="advanced-toggle">
              <input
                type="checkbox"
                checked={advancedSettings.prioritizeWeakAreas}
                onChange={(event) => updateAdvancedField("prioritizeWeakAreas", event.target.checked)}
              />
              Prioritize weak areas in schedule
            </label>
          </div>

          <p className="subject-details-note">
            Generates a day-wise plan that balances all subjects with exam urgency and weak areas.
          </p>
        </section>

        <section className="panel ai-recommendation-panel">
          <div className="ai-recommendation-header">
            <div>
              <p className="eyebrow">AI Recommendation</p>
              <h2>Suggested Setup</h2>
            </div>
            <span className="subject-chip">{aiRecommendation.mode}</span>
          </div>
          <div className="ai-recommendation-grid">
            <article className="recommendation-item">
              <h4>Exam Timeline</h4>
              <p>{examCountdown}</p>
            </article>
            <article className="recommendation-item">
              <h4>Subjects in Queue</h4>
              <p>{subjectsForPlanning.length}</p>
            </article>
            <article className="recommendation-item">
              <h4>Weak Topics</h4>
              <p>{weakAreaCount}</p>
            </article>
            <article className="recommendation-item">
              <h4>Expected Weekly Study</h4>
              <p>{weeklyStudyHours} hrs</p>
            </article>
          </div>
          <p className="subject-details-note">{aiRecommendation.reason}</p>
        </section>

        <div className="panel">
          <h2>Plan Builder</h2>

          <div className="add-task">
            <input
              type="text"
              placeholder="Task name"
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
            />
            <input
              type="number"
              placeholder="Time (mins)"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
            />
            <button onClick={addTask}>Add</button>
            <button type="button" className="ghost-btn" onClick={useSubjectDetails}>
              Use Details
            </button>
            <button className="ai-plan-btn" onClick={addAiPlan}>
              AI Plan
            </button>
          </div>

          <p className="ai-note">{aiMessage}</p>

          <div className="task-list">
            {tasks.map((task, index) => (
              <div key={`${task.text}-${index}`} className={`task ${task.done ? "done" : ""}`}>
                <span onClick={() => toggleTask(index)}>
                  {task.text} - {task.time} mins
                </span>
                <button onClick={() => deleteTask(index)}>X</button>
              </div>
            ))}
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </main>
    </div>
  );
}
