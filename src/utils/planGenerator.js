export function generateAdaptivePlan({
  subjects,
  accuracy,
  weakTopics,
  dailyTime
}) {
  let plan = [];
  let totalSubjects = subjects.length;
  let baseTime = Math.floor(dailyTime / totalSubjects);

  subjects.forEach((subject) => {
    let taskTime = baseTime;
    let difficulty = "Revision";

    // 🔥 If subject is weak → increase time + deep practice
    if (weakTopics.includes(subject)) {
      taskTime += 20;
      difficulty = "Deep Practice";
    }

    // 📉 If overall accuracy low → more practice
    if (accuracy < 60) {
      taskTime += 10;
      difficulty = "Practice";
    }

    // 📈 If accuracy high → reduce time
    if (accuracy > 80) {
      taskTime -= 10;
      difficulty = "Quick Revision";
    }

    if (taskTime < 20) taskTime = 20;

    plan.push({
      subject,
      time: taskTime,
      type: difficulty,
      completed: false
    });
  });

  return plan;
}
