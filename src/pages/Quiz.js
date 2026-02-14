import React, { useState } from "react";
import { getDifficulty } from "../utils/aiEngine";

export default function Quiz() {
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState("Easy");

  const handleSubmit = () => {
    const newDifficulty = getDifficulty(score);
    setDifficulty(newDifficulty);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Adaptive Quiz</h2>

      <input
        type="number"
        placeholder="Enter your score (0-100)"
        onChange={(e) => setScore(Number(e.target.value))}
      />

      <br /><br />

      <button onClick={handleSubmit}>Submit</button>

      <h3>Next Difficulty: {difficulty}</h3>
    </div>
  );
}
