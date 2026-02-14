import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    const studentData = {
      name,
      email: email.toLowerCase(),
      goal,
      password
    };

    localStorage.setItem("student", JSON.stringify(studentData));

    navigate("/");
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSignup}>
        <h2>Create Student Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Student Email ID"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <select
          style={styles.input}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
        >
          <option value="">Select Goal</option>
          <option value="Placements">Placements</option>
          <option value="GATE">GATE</option>
          <option value="Semester">Semester Exams</option>
          <option value="CAT">CAT</option>
        </select>

        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button style={styles.button}>Sign Up</button>

        <p style={{ marginTop: 10 }}>
          Already have account? <Link to="/">Login</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#667eea,#764ba2)"
  },
  card: {
    background: "white",
    padding: 35,
    borderRadius: 15,
    width: 360,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  input: {
    width: "100%",
    padding: 10,
    margin: "10px 0",
    borderRadius: 8,
    border: "1px solid #ddd"
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold"
  }
};
