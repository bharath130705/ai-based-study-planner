import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Planner() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [time, setTime] = useState("");

  const savePlan = () => {
    if (!subject || !topic || !time) return alert("Fill all fields");

    localStorage.setItem(
      "studyPlan",
      JSON.stringify({ subject, topic, time: Number(time) })
    );

    alert("Plan saved ✅");
    navigate("/dashboard");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Study Plan</h2>

      <input
        placeholder="Subject (DSA / Aptitude)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ display: "block", width: 320, padding: 10, margin: "10px 0" }}
      />

      <input
        placeholder="Topic (Arrays / Profit & Loss)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        style={{ display: "block", width: 320, padding: 10, margin: "10px 0" }}
      />

      <input
        type="number"
        placeholder="Daily time (minutes)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        style={{ display: "block", width: 320, padding: 10, margin: "10px 0" }}
      />

      <button onClick={savePlan} style={{ padding: 10, fontWeight: 800 }}>
        Save Plan
      </button>

      <button onClick={() => navigate("/dashboard")} style={{ marginLeft: 10, padding: 10 }}>
        Back
      </button>
    </div>
  );
}
