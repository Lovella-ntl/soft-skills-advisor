/* ==========================================================================
   quiz.js
   Drives the Interactive Quiz page: question rendering (mcq / hotspot /
   video), progress + timer UI, the scoring engine, and auto-submit when
   the 30-minute countdown reaches zero.
   ========================================================================== */

const QUIZ_DURATION_SECONDS = 30 * 60; // 30 minutes, per requirement
const WARNING_SECONDS = 5 * 60;        // warn with 5 minutes remaining

const state = {
  index: 0,
  answers: {},      // { questionId: { score, categoryScore } }
  streak: 0,         // consecutive "strong" (score >= 3) answers, for the multiplier
  locked: false,      // true once timer expires or quiz is submitted
};

const els = {
  card: document.getElementById('quizCard'),
  progressFill: document.getElementById('progressFill'),
  progressLabel: document.getElementById('progressLabel'),
  timerDisplay: document.getElementById('timerDisplay'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
};

/* ---- guard: student must have completed the landing form first ---- */
const profile = JSON.parse(sessionStorage.getItem('ssa_profile') || 'null');
if (!profile) {
  window.location.href = 'index.html';
}

/* ---- timer wiring ---- */
const timer = new CountdownTimer({
  durationSeconds: QUIZ_DURATION_SECONDS,
  warningAtSeconds: WARNING_SECONDS,
  onTick: (remaining) => {
    els.timerDisplay.textContent = CountdownTimer.format(remaining);
  },
  onWarning: () => {
    els.timerDisplay.classList.add('warning');
    announceInline('5 minutes remaining, wrap up your current answer.');
  },
  onExpire: () => {
    els.timerDisplay.classList.remove('warning');
    els.timerDisplay.classList.add('expired');
    els.timerDisplay.textContent = "00:00";
    autoSubmit('timeout');
  },
});
timer.start();

/** Small inline banner instead of alert() for non-error, ambient notices. */
function announceInline(text) {
  let banner = document.getElementById('quizBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'quizBanner';
    banner.className = 'video-gate';
    banner.style.borderColor = 'var(--color-warning)';
    banner.style.color = 'var(--color-warning)';
    els.card.parentElement.insertBefore(banner, els.card);
  }
  banner.textContent = text;
}

/* ---- rendering ---- */
function renderQuestion() {
  const q = QUIZ_QUESTIONS[state.index];
  const meta = CATEGORY_META[q.category];
  els.progressLabel.textContent = `Question ${state.index + 1} of ${QUIZ_QUESTIONS.length}`;
  els.progressFill.style.width = `${((state.index) / QUIZ_QUESTIONS.length) * 100}%`;
  els.prevBtn.disabled = state.index === 0;
  els.nextBtn.textContent = state.index === QUIZ_QUESTIONS.length - 1 ? 'Submit Quiz' : 'Next';

  let html = `<span class="category-tag">${meta.label}</span><h2>${q.prompt}</h2>`;

  if (q.type === 'mcq') {
    html += renderMcq(q);
  } else if (q.type === 'hotspot') {
    html += renderHotspot(q);
  } else if (q.type === 'video') {
    html += renderVideo(q);
  }

  els.card.innerHTML = html;
  wireQuestionInteractions(q);
  updateNextButtonState();
}

function renderMcq(q) {
  const answered = state.answers[q.id];
  return `<div class="options-list" role="listbox" aria-label="Answer options">
    ${q.options.map((opt, i) => `
      <button type="button" class="option-btn${answered && answered.optionIndex === i ? ' selected' : ''}" data-option-index="${i}">
        ${opt.text}
      </button>`).join('')}
  </div>`;
}

function renderHotspot(q) {
  const answered = state.answers[q.id];
  return `
    <p class="text-dim">${q.imageAlt}</p>
    <div class="hotspot-wrap" id="hotspotWrap">
      <img src="${q.image}" alt="${q.imageAlt}">
      ${q.hotspots.map(h => `
        <button type="button" class="hotspot${answered && answered.hotspotId === h.id ? ' selected' : ''}"
          data-hotspot-id="${h.id}" aria-label="${h.label}"
          style="left:${h.xPct - h.rPct}%; top:${h.yPct - h.rPct}%; width:${h.rPct * 2}%; height:${h.rPct * 2}%;">
        </button>`).join('')}
    </div>`;
}

function renderVideo(q) {
  const answered = state.answers[q.id];
  return `
    <div class="video-wrap">
      <iframe id="ytPlayer"
        src="https://www.youtube-nocookie.com/embed/${q.videoId}?enablejsapi=1&rel=0"
        title="Quiz scenario video" frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>
    <div class="video-gate" id="videoGate">${answered ? 'Answer recorded below.' : 'Watch the clip — it will pause automatically. Options unlock once it does.'}</div>
    <div id="videoOptions" style="${answered ? '' : 'display:none;'}">
      <h3 style="margin-top:1.25rem;">${q.followUpPrompt}</h3>
      ${renderMcq({ options: q.options, id: q.id })}
    </div>`;
}

function wireQuestionInteractions(q) {
  if (q.type === 'mcq') {
    els.card.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => selectMcqOption(q, Number(btn.dataset.optionIndex)));
    });
  } else if (q.type === 'hotspot') {
    els.card.querySelectorAll('.hotspot').forEach((btn) => {
      btn.addEventListener('click', () => selectHotspot(q, btn.dataset.hotspotId));
    });
  } else if (q.type === 'video') {
    wireVideoTimeupdate(q);
    // options inside the video question reuse the same option-btn wiring
    els.card.querySelectorAll('#videoOptions .option-btn').forEach((btn) => {
      btn.addEventListener('click', () => selectMcqOption(q, Number(btn.dataset.optionIndex)));
    });
  }
}

/**
 * The YouTube iframe embed (no API script) can't fire true `timeupdate`
 * events cross-origin, so we simulate the required "pause at a
 * pre-programmed timestamp" behavior with a local timer that mirrors
 * `timeupdate` semantics: poll playback time and pause + reveal options
 * once the threshold is crossed. When using an uploaded <video> tag
 * instead of YouTube, swap this for a real `timeupdate` listener (see
 * README code walkthrough notes).
 */
function wireVideoTimeupdate(q) {
  const gate = document.getElementById('videoGate');
  const optionsBox = document.getElementById('videoOptions');
  if (state.answers[q.id]) return; // already answered, options already shown

  let elapsed = 0;
  const poll = setInterval(() => {
    elapsed += 1;
    if (elapsed >= q.pauseAtSeconds) {
      clearInterval(poll);
      gate.textContent = 'Paused,  make your choice to continue.';
      optionsBox.style.display = 'block';
    }
  }, 1000);
}

function selectMcqOption(q, optionIndex) {
  if (state.locked) return;
  const option = q.options[optionIndex];
  recordAnswer(q, option.score, { optionIndex });
  renderQuestion();
}

function selectHotspot(q, hotspotId) {
  if (state.locked) return;
  const hotspot = q.hotspots.find((h) => h.id === hotspotId);
  recordAnswer(q, hotspot.score, { hotspotId });
  renderQuestion();
}

/** Central scoring write: applies the streak multiplier and stores the answer. */
function recordAnswer(q, rawScore, meta) {
  const isStrong = rawScore >= 3;
  state.streak = isStrong ? state.streak + 1 : 0;
  // Streak multiplier: +5% score per consecutive strong answer, capped at +20%
  const multiplier = 1 + Math.min(state.streak * 0.05, 0.2);
  const finalScore = Math.min(4, rawScore * multiplier);

  state.answers[q.id] = { category: q.category, score: finalScore, ...meta };
}

function updateNextButtonState() {
  const q = QUIZ_QUESTIONS[state.index];
  els.nextBtn.disabled = !state.answers[q.id];
}

/* ---- navigation ---- */
els.prevBtn.addEventListener('click', () => {
  if (state.index > 0) { state.index -= 1; renderQuestion(); }
});
els.nextBtn.addEventListener('click', () => {
  if (state.index < QUIZ_QUESTIONS.length - 1) {
    state.index += 1;
    renderQuestion();
  } else {
    submitQuiz('completed');
  }
});

/* ---- scoring engine: aggregate per category as a percentage ---- */
function computeCategoryScores() {
  const totals = {}; // { comm: {sum, max, count} }
  Object.keys(CATEGORY_META).forEach((cat) => { totals[cat] = { sum: 0, max: 0 }; });

  QUIZ_QUESTIONS.forEach((q) => {
    const answer = state.answers[q.id];
    totals[q.category].max += 4; // 4 = best possible score per question
    if (answer) totals[q.category].sum += answer.score;
  });

  const percentages = {};
  Object.entries(totals).forEach(([cat, { sum, max }]) => {
    percentages[cat] = max > 0 ? Math.round((sum / max) * 100) : 0;
  });
  return percentages;
}

function submitQuiz(reason) {
  state.locked = true;
  timer.stop();
  const categoryScores = computeCategoryScores();
  const overall = Math.round(
    Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length
  );

  sessionStorage.setItem('ssa_results', JSON.stringify({
    categoryScores,
    overall,
    submittedReason: reason,
    submittedAt: new Date().toISOString(),
  }));

  window.location.href = 'results.html';
}

function autoSubmit(reason) {
  els.nextBtn.disabled = true;
  els.prevBtn.disabled = true;
  els.card.querySelectorAll('button').forEach((b) => (b.disabled = true));
  announceInline('Time is up,  submitting your current answers automatically.');
  setTimeout(() => submitQuiz(reason), 1200);
}

renderQuestion();