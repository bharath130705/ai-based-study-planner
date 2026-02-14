import React, { useState } from "react";

export default function Tutor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askAI = () => {
    if (!question) return;
    setAnswer("This is a demo AI response explaining: " + question);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>🤖 AI Tutor</h2>

      <input
        type="text"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ padding: "10px", width: "300px" }}
      />

      <button onClick={askAI} style={{ marginLeft: "10px" }}>
        Ask
      </button>

      {answer && (
        <div style={{ marginTop: "20px" }}>
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
