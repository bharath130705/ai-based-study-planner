import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    const savedStudent = JSON.parse(localStorage.getItem("student"));

    if (
      savedStudent &&
      savedStudent.email === email.toLowerCase() &&
      savedStudent.password === password
    ) {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h2>Student Login</h2>

        {error && <p style={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="Student Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button style={styles.button}>Login</button>

        <p style={{ marginTop: 10 }}>
          New student? <Link to="/signup">Sign up</Link>
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
  },
  error: {
    color: "red"
  }
};
