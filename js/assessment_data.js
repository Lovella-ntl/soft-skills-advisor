/* ==========================================================================
   assessment-data.js
   The 20-statement Likert-scale assessment bank (5 statements per value),
   plus value metadata and the below-60% recommendation copy shown on the
   Results page. Kept separate from the assessment engine (assessment.js)
   so content can be edited without touching logic.

   Each statement:
     id        — unique key, used as the radio-group name
     category  — one of "communication" | "critical" | "time" | "leadership"
     text      — the statement shown in the table row

   All statements are phrased positively ("I do X well") so the Likert
   scale maps directly onto a score: Strongly Disagree = 1 point,
   Disagree = 2, Neutral = 3, Agree = 4, Strongly Agree = 5.
   ========================================================================== */

const SSA_SCALE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const SSA_STATEMENTS = [
  // --- Communication (5) ---
  { id: "s1", category: "communication", text: "I explain my ideas clearly, so others rarely need to ask me to repeat myself." },
  { id: "s2", category: "communication", text: "I listen fully before responding, instead of planning my reply while others are still talking." },
  { id: "s3", category: "communication", text: "I stay calm and clear when giving feedback, even if the topic is uncomfortable." },
  { id: "s4", category: "communication", text: "I adjust how I explain something depending on who I'm talking to." },
  { id: "s5", category: "communication", text: "I speak up in group settings when I have something relevant to add." },

  // --- Critical Thinking (5) ---
  { id: "s6", category: "critical", text: "I look for evidence before accepting a conclusion, rather than going with my first impression." },
  { id: "s7", category: "critical", text: "I can identify weak assumptions in an argument, including my own." },
  { id: "s8", category: "critical", text: "I consider multiple possible explanations before deciding on one." },
  { id: "s9", category: "critical", text: "I ask 'why' or 'how do we know that' before acting on new information." },
  { id: "s10", category: "critical", text: "I'm comfortable changing my opinion when presented with better evidence." },

  // --- Time Management (5) ---
  { id: "s11", category: "time", text: "I prioritise tasks by importance and urgency rather than by what feels easiest." },
  { id: "s12", category: "time", text: "I rarely leave important work until the last possible moment." },
  { id: "s13", category: "time", text: "When my schedule changes unexpectedly, I re-plan quickly instead of losing momentum." },
  { id: "s14", category: "time", text: "I break large tasks into smaller steps with their own mini-deadlines." },
  { id: "s15", category: "time", text: "I know realistically how long a task will take me before I start it." },

  // --- Leadership (5) ---
  { id: "s16", category: "leadership", text: "I'm comfortable taking initiative in a group, even without being asked." },
  { id: "s17", category: "leadership", text: "I make decisions under pressure without becoming reactive or defensive." },
  { id: "s18", category: "leadership", text: "I notice when a teammate needs support and offer it without being asked." },
  { id: "s19", category: "leadership", text: "I take responsibility for outcomes, even when a decision I made didn't work out." },
  { id: "s20", category: "leadership", text: "I can motivate a group toward a shared goal, not just manage my own tasks." },
];

/* --- Value metadata used across assessment + values + results pages ------- */
const SSA_SKILLS = {
  communication: { label: "Communication", color: "#2EC4B6" },
  critical: { label: "Critical Thinking", color: "#6C63A6" },
  time: { label: "Time Management", color: "#E85D4E" },
  leadership: { label: "Leadership", color: "#F2A541" },
};

/* --- Recommendations, shown on the Results page whenever a value scores
   below 60%. Above 60%, a shorter affirming note is shown instead. ------- */
const SSA_RECOMMENDATIONS = {
  communication: {
    strong: "Your communication comes through as clear and composed, keep seeking out higher-stakes conversations to sharpen it further.",
    improve: "Communication scored below 60%. Try this: before your next group task, practice summarising what someone just said before you reply, it forces active listening and reduces miscommunication.",
  },
  critical: {
    strong: "You consistently question assumptions before drawing conclusions, a strong foundation for sound decision-making.",
    improve: "Critical Thinking scored below 60%. Try this: before finalising your next decision, write down two alternative explanations you haven't considered yet, and check what evidence would rule each one out.",
  },
  time: {
    strong: "You prioritise well and adapt your plans early rather than reactively, keep building on that habit.",
    improve: "Time Management scored below 60%. Try this: the night before a busy day, write down your top 3 tasks in priority order, research shows pre-committing to priorities reduces last-minute scrambling.",
  },
  leadership: {
    strong: "You show solid leadership instincts, initiative, accountability, and reading what a team needs.",
    improve: "Leadership scored below 60%. Try this: volunteer to lead one small, low-stakes task in your next group project, leadership confidence builds fastest through small, repeated reps, not big moments.",
  },
};

function ssaGetRecommendation(category, percentage) {
  const rec = SSA_RECOMMENDATIONS[category];
  return percentage < 60
    ? { tier: "Needs improvement", text: rec.improve, needsImprovement: true }
    : { tier: "Strong", text: rec.strong, needsImprovement: false };
}