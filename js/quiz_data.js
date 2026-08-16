/* ==========================================================================
   quiz-data.js
   The question bank + scoring reference data, kept separate from the quiz
   engine (quiz.js) so content can be edited without touching logic.

   Each question:
     id       — unique key
     category — one of "communication" | "critical" | "time" | "leadership"
     type     — "choice" | "hotspot" | "audio" | "video"
     prompt   — question text
     options  — for "choice"/"audio"/"video": array of { text, points }
                points (1-4) = how strongly that response demonstrates the
                skill being measured (this is a self-assessment tool, not a
                right/wrong quiz).
     hotspot  — for "hotspot" type: { regions: [{id, points, label}] }
   ========================================================================== */

const SSA_QUESTIONS = [
  {
    id: "q1",
    category: "communication",
    type: "choice",
    prompt:
      "During a group project, a teammate misreads your instructions and redoes the wrong section. What do you do first?",
    options: [
      { text: "Explain calmly what you meant and check they now understand", points: 4 },
      { text: "Re-send the original instructions and hope it's clearer this time", points: 2 },
      { text: "Redo the section yourself without saying anything", points: 1 },
      { text: "Point out the mistake in the group chat for everyone to see", points: 1 },
    ],
  },
  {
    id: "q2",
    category: "communication",
    type: "audio",
    prompt:
      "Listen to the scenario, then choose the response that best demonstrates strong communication.",
    audioSrc: "assets/audio-scenario.wav",
    audioCaption:
      "Audio: \"A colleague interrupts you mid-presentation with a strong objection — what do you do?\"",
    options: [
      { text: "Acknowledge the point, note it, and continue — offer to discuss after", points: 4 },
      { text: "Stop and fully debate the objection right then, in front of everyone", points: 2 },
      { text: "Ignore the interruption and keep talking over them", points: 1 },
      { text: "Ask them to leave the room", points: 1 },
    ],
  },
  {
    id: "q3",
    category: "critical",
    type: "choice",
    prompt:
      "Your data shows sales dropped 20% last month. Before concluding your product is failing, what should you check first?",
    options: [
      { text: "Whether an external factor (season, holiday, market shift) explains it", points: 4 },
      { text: "Compare it against last year's data for the same month", points: 3 },
      { text: "Assume the product is failing and start planning a relaunch", points: 1 },
      { text: "Ask a friend for their opinion on the product", points: 1 },
    ],
  },
  {
    id: "q4",
    category: "critical",
    type: "choice",
    prompt: "A classmate argues: \"Everyone in our year loves this app, so it must be good.\" What's the flaw here?",
    options: [
      { text: "It assumes popularity proves quality — that's not a logical guarantee", points: 4 },
      { text: "There's no flaw, popularity is a solid measure of quality", points: 1 },
      { text: "The flaw is that the app might be expensive", points: 1 },
      { text: "It's not really a flaw, just an opinion", points: 2 },
    ],
  },
  {
    id: "q5",
    category: "time",
    type: "choice",
    prompt: "You have three tasks due Friday: one urgent+important, one important but not urgent, one neither. Order?",
    options: [
      { text: "Urgent+important first, then important, then the last one if time allows", points: 4 },
      { text: "Whichever is quickest to finish first, regardless of importance", points: 2 },
      { text: "The one you enjoy most first", points: 1 },
      { text: "Start all three at once and switch between them", points: 1 },
    ],
  },
  {
    id: "q6",
    category: "time",
    type: "choice",
    prompt: "You realise at 4pm that today's plan is unrealistic and one task must slip. What's the best move?",
    options: [
      { text: "Re-prioritise now, tell anyone affected, and adjust the plan", points: 4 },
      { text: "Push through and try to do everything anyway, staying up late", points: 2 },
      { text: "Say nothing and hope no one notices the delay", points: 1 },
      { text: "Drop the task with no explanation to anyone", points: 1 },
    ],
  },
  {
    id: "q7",
    category: "leadership",
    type: "hotspot",
    prompt:
      "This is a team meeting. Click on the person showing the clearest signs of confident, engaged leadership body language.",
    hotspot: {
      regions: [
        { id: "leanIn", label: "Leaning in, making eye contact, open posture", points: 4 },
        { id: "phone", label: "Looking at their phone, arms crossed", points: 1 },
        { id: "slouch", label: "Slouched back, distracted", points: 1 },
        { id: "notes", label: "Quietly taking notes, engaged but passive", points: 3 },
      ],
    },
  },
  {
    id: "q8",
    category: "leadership",
    type: "video",
    prompt:
      "Watch the scenario. It will pause automatically — decide what the team lead should do next before continuing.",
    videoSrc: "assets/scenario.mp4",
    pauseAt: 6, // seconds — JS listens for 'timeupdate' and pauses here
    options: [
      { text: "Pause, ask the team for input, then decide together", points: 4 },
      { text: "Make the call alone immediately without asking anyone", points: 2 },
      { text: "Avoid deciding and let the deadline pass", points: 1 },
      { text: "Assign blame for the conflict before addressing it", points: 1 },
    ],
  },
];

/* --- Skill metadata used across quiz + results pages --------------------- */
const SSA_SKILLS = {
  communication: { label: "Communication", color: "#2EC4B6" },
  critical: { label: "Critical Thinking", color: "#6C63A6" },
  time: { label: "Time Management", color: "#E85D4E" },
  leadership: { label: "Leadership", color: "#F2A541" },
};

/* --- Feedback tiers, keyed by percentage of max score reached ------------- */
const SSA_FEEDBACK = {
  communication: [
    { min: 85, tier: "Exceptional", text: "You communicate with clarity and composure, even under pressure.", next: "Practice facilitating a group discussion to sharpen real-time listening skills." },
    { min: 60, tier: "Strong", text: "You explain yourself clearly and generally read the room well.", next: "Work on pausing before reacting to interruptions or objections." },
    { min: 35, tier: "Developing", text: "You get your point across, but responses can be reactive under pressure.", next: "Try the 'pause, acknowledge, respond' habit in your next group project." },
    { min: 0, tier: "Emerging", text: "Communication under pressure is an area with real growth potential.", next: "Start with low-stakes practice: summarise others' points before replying." },
  ],
  critical: [
    { min: 85, tier: "Exceptional", text: "You consistently question assumptions before drawing conclusions.", next: "Mentor a peer through a structured decision — teaching sharpens the skill further." },
    { min: 60, tier: "Strong", text: "You usually look for evidence before deciding, with occasional shortcuts.", next: "Practice writing out your reasoning before finalising a conclusion." },
    { min: 35, tier: "Developing", text: "You can spot obvious flaws but may accept convenient conclusions.", next: "Ask 'what would change my mind?' before finalising a decision." },
    { min: 0, tier: "Emerging", text: "Decisions currently lean on assumption more than evidence.", next: "Practice the 'assume nothing' drill: list 3 alternative explanations before deciding." },
  ],
  time: [
    { min: 85, tier: "Exceptional", text: "You prioritise instinctively and adapt plans early rather than late.", next: "Try mentoring others on the urgent/important matrix." },
    { min: 60, tier: "Strong", text: "You generally prioritise well, with room to adjust plans sooner.", next: "Build in a mid-day checkpoint to re-prioritise before problems compound." },
    { min: 35, tier: "Developing", text: "Prioritisation happens, but often reactively rather than planned.", next: "Try planning tomorrow's top 3 tasks the night before." },
    { min: 0, tier: "Emerging", text: "Time management currently has the most room to grow.", next: "Start with a simple urgent/important matrix for your next busy week." },
  ],
  leadership: [
    { min: 85, tier: "Exceptional", text: "You read situations and people well, and lead collaboratively.", next: "Take on a formal leadership role in your next group project." },
    { min: 60, tier: "Strong", text: "You show solid leadership instincts, especially in calm moments.", next: "Practice leading under time pressure or ambiguity specifically." },
    { min: 35, tier: "Developing", text: "You can lead when asked, but may hesitate to take initiative.", next: "Volunteer to lead one small task in your next group setting." },
    { min: 0, tier: "Emerging", text: "Leadership is an emerging skill with a clear path to grow.", next: "Start by simply asking 'what does the team need right now?' in group work." },
  ],
};

function ssaGetFeedback(category, percentage) {
  const tiers = SSA_FEEDBACK[category];
  return tiers.find((t) => percentage >= t.min) || tiers[tiers.length - 1];
}