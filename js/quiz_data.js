/* ==========================================================================
   quiz-data.js
   Question bank for the Soft Skills Advisor quiz.
   Each option carries a `score` from 1 (needs growth) to 4 (exemplary) that
   feeds the scoring engine in quiz.js. Categories: Communication (comm),
   CriticalThinking (crit), TimeManagement (time), Leadership (lead).

   Two questions use interactive media, satisfying the "at least two"
   media requirement:
     - Q4 is an IMAGE HOTSPOT question (coordinate-based click detection
       over the generated scenario illustration in assets/images).
     - Q8 is a VIDEO SCENARIO question (embedded YouTube Short that pauses
       at a timestamp via the JS `timeupdate` event before revealing options).
   ========================================================================== */

const QUIZ_QUESTIONS = [
  {
    id: 'q1', type: 'mcq', category: 'comm',
    prompt: 'A teammate misunderstands your instructions for the second time. What do you do?',
    options: [
      { text: 'Repeat the same instructions, louder and slower.', score: 1 },
      { text: 'Get frustrated and finish the task yourself.', score: 2 },
      { text: 'Ask them to repeat it back in their own words, then clarify gaps.', score: 4 },
      { text: 'Send a follow-up email restating the instructions.', score: 3 },
    ],
  },
  {
    id: 'q2', type: 'mcq', category: 'comm',
    prompt: 'During a group presentation, a classmate goes off-topic. How do you respond in the moment?',
    options: [
      { text: 'Interrupt them abruptly to move on.', score: 1 },
      { text: 'Let it slide and hope the audience forgets.', score: 2 },
      { text: 'Politely acknowledge the point and steer back to the agenda.', score: 4 },
      { text: 'Signal to the moderator to intervene.', score: 3 },
    ],
  },
  {
    id: 'q3', type: 'mcq', category: 'crit',
    prompt: 'You receive conflicting data from two sources on the same topic. What is your first move?',
    options: [
      { text: 'Trust whichever source you found first.', score: 1 },
      { text: 'Average the two numbers and move on.', score: 2 },
      { text: 'Check each source\u2019s methodology and credibility before deciding.', score: 4 },
      { text: 'Ask a friend which one sounds more right.', score: 2 },
    ],
  },
  {
    id: 'q4', type: 'hotspot', category: 'comm',
    prompt: 'Look at the meeting scene below. Click on the person showing the strongest active-listening body language.',
    image: 'assets/images/hotspot-scenario.svg',
    imageAlt: 'Illustration of four colleagues around a meeting table',
    // Coordinates are percentages of the rendered image box (responsive-safe)
    hotspots: [
      { id: 'p1', label: 'Person checking phone', xPct: 12.5, yPct: 44, rPct: 9, score: 1 },
      { id: 'p2', label: 'Person with arms crossed', xPct: 32.5, yPct: 42, rPct: 9, score: 1 },
      { id: 'p3', label: 'Person speaking', xPct: 70, yPct: 44, rPct: 9, score: 2 },
      { id: 'p4', label: 'Person leaning in, eye contact', xPct: 55, yPct: 40, rPct: 9, score: 4 },
    ],
  },
  {
    id: 'q5', type: 'mcq', category: 'crit',
    prompt: 'A proposed solution "sounds right" but you have not tested it. What next?',
    options: [
      { text: 'Ship it — instinct is usually enough.', score: 1 },
      { text: 'Ask a senior colleague to bless it without testing.', score: 2 },
      { text: 'Design a small test case to verify the assumption first.', score: 4 },
      { text: 'Wait for someone else to test it eventually.', score: 2 },
    ],
  },
  {
    id: 'q6', type: 'mcq', category: 'time',
    prompt: 'You have three deadlines this week, all marked "urgent" by different people. How do you plan?',
    options: [
      { text: 'Work on whichever one was assigned last.', score: 1 },
      { text: 'Do the easiest one first to build momentum.', score: 2 },
      { text: 'Rank by real impact and dependency, then build a schedule.', score: 4 },
      { text: 'Ask a friend which one they\u2019d do first.', score: 2 },
    ],
  },
  {
    id: 'q7', type: 'mcq', category: 'time',
    prompt: 'You notice you keep underestimating how long tasks take. What is the most effective fix?',
    options: [
      { text: 'Ignore it — deadlines are flexible anyway.', score: 1 },
      { text: 'Add a vague "buffer" with no real basis.', score: 2 },
      { text: 'Track actual time spent for two weeks and recalibrate estimates.', score: 4 },
      { text: 'Ask for extensions preemptively on everything.', score: 2 },
    ],
  },
  {
    id: 'q8', type: 'video', category: 'time',
    prompt: 'Watch the short clip on prioritization. It will pause partway through — decide what you would do next before it continues.',
    // Embed uses the YouTube privacy-enhanced player. Swap videoId for any
    // short, relevant clip — see README for how to source one.
    videoId: 'iONDebHX9qk',
    pauseAtSeconds: 12,
    followUpPrompt: 'Before the video continues: which task should you tackle first if it is both urgent AND important?',
    options: [
      { text: 'The one that takes the least time.', score: 2 },
      { text: 'The one that is loudest right now, regardless of impact.', score: 1 },
      { text: 'The one sitting in the "urgent + important" quadrant.', score: 4 },
      { text: 'Whichever one a teammate reminds you about next.', score: 2 },
    ],
  },
  {
    id: 'q9', type: 'mcq', category: 'lead',
    prompt: 'A team member is struggling but hasn\u2019t asked for help. What do you do?',
    options: [
      { text: 'Wait until they fail so it becomes obvious.', score: 1 },
      { text: 'Take the task away from them quietly.', score: 2 },
      { text: 'Check in privately and offer specific, optional support.', score: 4 },
      { text: 'Mention it publicly so the team pressures them.', score: 1 },
    ],
  },
  {
    id: 'q10', type: 'mcq', category: 'lead',
    prompt: 'Your group disagrees on direction two days before a deadline. What is the best move?',
    options: [
      { text: 'Force your own idea through since time is short.', score: 2 },
      { text: 'Let the group argue it out with no facilitation.', score: 1 },
      { text: 'Facilitate a quick decision using shared criteria, then commit as a team.', score: 4 },
      { text: 'Escalate to an instructor immediately.', score: 2 },
    ],
  },
];

const CATEGORY_META = {
  comm: { label: 'Communication', description: 'How clearly and empathetically you exchange information.' },
  crit: { label: 'Critical Thinking', description: 'How rigorously you evaluate evidence before deciding.' },
  time: { label: 'Time Management', description: 'How well you plan, prioritize, and estimate effort.' },
  lead: { label: 'Leadership', description: 'How you support, guide, and align a team.' },
};

window.QUIZ_QUESTIONS = QUIZ_QUESTIONS;
window.CATEGORY_META = CATEGORY_META;