const KEY = "sp_app_v1";

export function loadApp() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    return (
      data || {
        onboarding: null,
        plan: null,
        tasksByDate: {}, // {"YYYY-MM-DD": [{text, done, type, subject, topic}]}
        quizHistory: [], // [{date, subject, topic, score, total, wrong: [...] }]
        weakTopics: {}, // {"DSA:Arrays": {wrong: 3, right: 5}}
        streak: { current: 0, best: 0, lastCompletedDate: null },
      }
    );
  } catch {
    return {
      onboarding: null,
      plan: null,
      tasksByDate: {},
      quizHistory: [],
      weakTopics: {},
      streak: { current: 0, best: 0, lastCompletedDate: null },
    };
  }
}

export function saveApp(app) {
  localStorage.setItem(KEY, JSON.stringify(app));
}

export function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function daysBetween(a, b) {
  // a,b as YYYY-MM-DD
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}
