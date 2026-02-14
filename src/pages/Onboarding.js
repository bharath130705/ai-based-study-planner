import React, { useState } from "react";

export default function Onboarding() {
  const [goal, setGoal] = useState("Placement");
  const [examDate, setExamDate] = useState("");
  const [dailyTime, setDailyTime] = useState(120);
  const [subjects, setSubjects] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [plan, setPlan] = useState([]);
  const [daysLeft, setDaysLeft] = useState(null);

  const generatePlan = () => {
    const subjectList = subjects.split(",").map(s => s.trim());

    const today = new Date();
    const exam = new Date(examDate);
    const remainingDays = Math.ceil(
      (exam - today) / (1000 * 60 * 60 * 24)
    );

    setDaysLeft(remainingDays);

    const weeklyPlan = [];

    subjectList.forEach((subject) => {
      let difficulty = "Medium";
      let revisionDay = "Day 3";

      if (confidence <= 2) {
        difficulty = "Easy + Practice";
        revisionDay = "Day 2";
      } else if (confidence >= 4) {
        difficulty = "Hard + Mock Test";
        revisionDay = "Day 5";
      }

      // 🔥 If exam near → increase intensity
      if (remainingDays < 30) {
        difficulty = "Revision + Mock Test Focus";
      }

      weeklyPlan.push({
        subject,
        difficulty,
        studyTime: Math.floor(dailyTime / subjectList.length),
        revision: revisionDay
      });
    });

    setPlan(weeklyPlan);
  };

  return (
    <div style={styles.page}>
      <h1>🎓 AI Smart Study Onboarding</h1>

      <div style={styles.card}>
        <label>🎯 Goal</label>
        <select value={goal} onChange={(e) => setGoal(e.target.value)}>
          <option>Placement</option>
          <option>GATE</option>
          <option>Semester</option>
          <option>CAT</option>
        </select>

        <label>📅 Exam Date</label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />

        <label>⏰ Daily Available Time (minutes)</label>
        <input
          type="number"
          value={dailyTime}
          onChange={(e) => setDailyTime(e.target.value)}
        />

        <label>📚 Subjects (comma separated)</label>
        <input
          type="text"
          placeholder="DSA, OS, DBMS"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
        />

        <label>📊 Confidence Level (1–5)</label>
        <input
          type="number"
          min="1"
          max="5"
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
        />

        <button style={styles.button} onClick={generatePlan}>
          Generate AI Plan
        </button>
      </div>

      {daysLeft !== null && (
        <div style={styles.card}>
          <h3>📅 Exam Countdown</h3>
          <p>{daysLeft} Days Remaining</p>
        </div>
      )}

      {plan.length > 0 && (
        <div style={styles.card}>
          <h2>📅 Personalized Weekly Roadmap</h2>

          {plan.map((item, index) => (
            <div key={index} style={styles.planItem}>
              <h3>{item.subject}</h3>
              <p>Study Time: {item.studyTime} mins/day</p>
              <p>Difficulty Mode: {item.difficulty}</p>
              <p>Revision Scheduled: {item.revision}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 40,
    fontFamily: "Arial",
    background: "#f4f6fa",
    minHeight: "100vh"
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  button: {
    padding: "10px",
    background: "#6c63ff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer"
  },
  planItem: {
    padding: 15,
    borderRadius: 8,
    background: "#eef1ff",
    marginBottom: 10
  }
};
