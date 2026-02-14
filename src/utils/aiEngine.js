// Advanced AI Study Plan Generator

export function generateAdvancedPlan(userProfile, quizResults) {
  const { subjects, dailyTime } = userProfile;

  const weakTopics = quizResults
    .filter(q => q.score < 60)
    .map(q => q.topic);

  const plan = [];

  subjects.forEach((subject, index) => {
    const baseTime = Math.floor(dailyTime / subjects.length);

    const isWeak = weakTopics.includes(subject);

    plan.push({
      id: index,
      subject,
      duration: isWeak ? baseTime + 20 : baseTime,
      type: isWeak ? "Deep Practice" : "Revision",
      priority: isWeak ? "High" : "Normal",
      completed: false
    });
  });

  return plan;
}

export function calculateProgress(tasks) {
  const done = tasks.filter(t => t.completed).length;
  return tasks.length === 0 ? 0 :
    Math.round((done / tasks.length) * 100);
}

export function generateAISuggestion(progress, weakTopics) {
  if (weakTopics.length > 0)
    return `Focus on weak areas: ${weakTopics.join(", ")}`;

  if (progress < 50)
    return "Increase study intensity today.";

  if (progress >= 80)
    return "Excellent work! Maintain momentum 🚀";

  return "Stay consistent!";
}
