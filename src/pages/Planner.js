import React, { useState } from "react";
import "./planner.css";

export default function Planner() {
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    if (!subject || !duration) return;

    const newTask = {
      id: Date.now(),
      subject,
      duration,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setSubject("");
    setDuration("");
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const totalTime = tasks.reduce(
    (sum, task) => sum + Number(task.duration),
    0
  );

  const completedTasks = tasks.filter((task) => task.completed).length;

  return (
    <div className="planner-container">
      <h2>📚 Custom Study Planner</h2>

      {/* Add Task Section */}
      <div className="planner-form">
        <input
          type="text"
          placeholder="Enter Subject (DSA, OS...)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <input
          type="number"
          placeholder="Time (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button onClick={addTask}>➕ Add</button>
      </div>

      {/* Summary */}
      <div className="planner-summary">
        <p>⏳ Total Study Time: {totalTime} mins</p>
        <p>✅ Completed: {completedTasks}/{tasks.length}</p>
      </div>

      {/* Task List */}
      <div className="planner-tasks">
        {tasks.length === 0 && <p>No tasks added yet.</p>}

        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <div>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
              <span
                style={{
                  textDecoration: task.completed ? "line-through" : "none",
                }}
              >
                {task.subject} — {task.duration} mins
              </span>
            </div>

            <button
              className="delete-btn"
              onClick={() => deleteTask(task.id)}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
