/* ==========================================================================
   results.js
   Reads the quiz results + student profile from sessionStorage, renders
   the percentage breakdown with comments/recommendations, draws the
   Canvas radar chart, and emails a copy of the results to the student.
   ========================================================================== */

const profile = JSON.parse(sessionStorage.getItem('ssa_profile') || 'null');
const results = JSON.parse(sessionStorage.getItem('ssa_results') || 'null');

if (!profile || !results) {
  window.location.href = 'index.html';
}

/** Turn a 0-100 score into a tier: comment + whether it needs improvement. */
function gradeTier(pct) {
  if (pct >= 85) return { tier: 'high', comment: 'Exemplary, this is a genuine strength to lean on.' };
  if (pct >= 70) return { tier: 'high', comment: 'Strong, solid, consistent performance in this area.' };
  if (pct >= 60) return { tier: 'mid', comment: 'Developing, the fundamentals are there but not yet consistent.' };
  return { tier: 'low', comment: 'Needs improvement, this is a priority area to work on.' };
}

function renderBreakdown() {
  const list = document.getElementById('scoreBreakdown');
  const recBox = document.getElementById('recommendations');
  const recommendations = [];

  list.innerHTML = Object.entries(results.categoryScores).map(([cat, pct]) => {
    const meta = CATEGORY_META[cat];
    const { tier, comment } = gradeTier(pct);
    if (pct < 60) {
      recommendations.push(`<strong>${meta.label}:</strong> ${suggestionFor(cat)}`);
    }
    return `
      <div class="score-row">
        <div>
          <strong>${meta.label}</strong>
          <div class="text-dim" style="font-size:0.85rem;">${comment}</div>
        </div>
        <span class="score-value ${tier}">${pct}%</span>
      </div>`;
  }).join('');

  document.getElementById('overallScore').textContent = `${results.overall}%`;
  document.getElementById('overallComment').textContent = gradeTier(results.overall).comment;

  recBox.innerHTML = recommendations.length
    ? `<h3>Recommended next steps</h3><ul>${recommendations.map((r) => `<li>${r}</li>`).join('')}</ul>`
    : `<p>All four categories are at or above 60% — great baseline. Keep reinforcing consistency.</p>`;
}

function suggestionFor(cat) {
  const suggestions = {
    comm: 'Practice active listening drills and ask for feedback on clarity after group work.',
    crit: 'Before deciding, write down two competing explanations and what evidence would rule each out.',
    time: 'Track your actual time-on-task for a week and build a prioritized weekly plan from real data.',
    lead: 'Take ownership of one small team task end-to-end and check in with teammates proactively.',
  };
  return suggestions[cat];
}

function renderChart() {
  const canvas = document.getElementById('resultsChart');
  const data = Object.entries(results.categoryScores).map(([cat, pct]) => ({
    label: CATEGORY_META[cat].label,
    value: pct,
  }));
  drawRadarChart(canvas, data);
}

async function dispatchEmail() {
  const statusEl = document.getElementById('emailStatus');
  const summaryLines = Object.entries(results.categoryScores)
    .map(([cat, pct]) => `${CATEGORY_META[cat].label}: ${pct}% — ${gradeTier(pct).comment}`);

  const summaryText = [
    `Soft Skills Advisor — Results for ${profile.name} (${profile.studentId})`,
    `Overall score: ${results.overall}%`,
    '',
    ...summaryLines,
  ].join('\n');

  statusEl.textContent = 'Sending your results by email…';
  const outcome = await sendResultsEmail({
    name: profile.name,
    studentId: profile.studentId,
    email: profile.email,
    summaryText,
  });

  statusEl.textContent = outcome.mode === 'emailjs'
    ? `A copy was emailed to ${profile.email}.`
    : `Opening your email client to send a copy to ${profile.email}.`;
}

document.getElementById('studentNameOut').textContent = profile.name;
document.getElementById('studentIdOut').textContent = profile.studentId;
renderBreakdown();
renderChart();
dispatchEmail();

document.getElementById('retakeBtn').addEventListener('click', () => {
  sessionStorage.removeItem('ssa_results');
  window.location.href = 'quiz.html';
});
