import React, { useState, useEffect } from "react";

export default function Pomodoro() {
  const [time, setTime] = useState(1500); // 25 minutes
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let timer;
    if (running && time > 0) {
      timer = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [running, time]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div style={styles.card}>
      <h3>⏳ Focus Timer</h3>
      <h2>
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </h2>
      <button onClick={() => setRunning(!running)}>
        {running ? "Pause" : "Start"}
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  }
};
