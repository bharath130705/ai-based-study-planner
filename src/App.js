import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AIStudyPlan from "./pages/AIStudyPlan";
import Analytics from "./pages/Analytics";
import Tutor from "./pages/Tutor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-study-plan" element={<AIStudyPlan />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/tutor" element={<Tutor />} />
      </Routes>
    </Router>
  );
}

export default App;
