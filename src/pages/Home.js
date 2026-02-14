import React from "react";
import { Link } from "react-router-dom";
export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>AI Study Planner</h1>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}
