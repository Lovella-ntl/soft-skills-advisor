/* ==========================================================================
   quiz.js
   The interactive quiz engine: countdown timer, custom progress pips,
   question rendering for all four question types (choice / hotspot /
   audio / video), multi-category scoring with a speed/streak multiplier,
   and timeout handling that locks the quiz and auto-submits.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Quiz state -------------------------------------------------------
     scores: running point total per category (before multiplier)
     answers: raw log of every answer for debugging / results detail
     streak: consecutive "fast" answers, used to grow the score multiplier */
  const state = {
    currentIndex: 0,
    scores: { communication: 0, critical: 0, time: 0, leadership: 0 },
    maxScores: { communication: 0, critical: 0, time: 0, leadership: 0 },
    answers: [],
    streak: 0,
    questionStartedAt: null,
    locked: false,
    // Holds the currently-picked-but-not-yet-committed answer for this
    // question. Nothing is scored until the student clicks "Next" — this
    // lets them change their mind before committing, unlike the old
    // auto-advance-on-click behaviour.
    pendingAnswer: null,
  };

  // Pre-compute the maximum possible points per category (best option = 4
  // points each) so the results page can express scores as percentages.
  SSA_QUESTIONS.forEach((q) => {
    state.maxScores[q.category] += 4;
  });

  const els = {
    pips: document.getElementById("progressPips"),
    timer: document.getElementById("quizTimer"),
    cardBody: document.getElementById("quizCardBody"),
    questionCounter: document.getElementById("questionCounter"),
    lockBanner: document.getElementById("lockBanner"),
    nextBtn: document.getElementById("nextBtn"),
  };

  /* ---- Countdown timer ----------------------------------------------------
     A single quiz-wide timer (5:00) built with setInterval/clearInterval,
     per the assignment's "Client-Side Timer" requirement. At 30s remaining
     it switches to a warning visual state; at 0 it locks all controls and
     auto-submits whatever has been answered so far. */
  const QUIZ_DURATION_SECONDS = 300; // 5 minutes
  let secondsRemaining = QUIZ_DURATION_SECONDS;
  let timerHandle = null;

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function startTimer() {
    els.timer.textContent = formatTime(secondsRemaining);
    timerHandle = setInterval(() => {
      secondsRemaining -= 1;
      els.timer.textContent = formatTime(secondsRemaining);

      if (secondsRemaining <= 30 && secondsRemaining > 0) {
        els.timer.classList.add("timer-warning");
      }

      if (secondsRemaining <= 0) {
        clearInterval(timerHandle);
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    // Timeout handling: lock every interactive control on the page and
    // show a visible banner, then auto-submit current progress.
    state.locked = true;
    els.timer.textContent = "0:00";
    els.timer.classList.remove("timer-warning");
    els.timer.classList.add("timer-locked");

    document
      .querySelectorAll(".quiz-option, .hotspot-region, .media-controls button, #nextBtn")
      .forEach((el) => {
        el.disabled = true;
        el.classList.add("is-disabled");
      });

    els.lockBanner.classList.remove("d-none");
    finishQuiz(true);
  }

  /* ---- Progress pips ------------------------------------------------------ */
  function renderPips() {
    els.pips.innerHTML = "";
    SSA_QUESTIONS.forEach((q, i) => {
      const pip = document.createElement("div");
      pip.className = "progress-pip";
      if (i === state.currentIndex) pip.classList.add("is-current");
      if (state.answers[i]) pip.classList.add("is-answered");
      pip.textContent = String(i + 1);
      pip.setAttribute("aria-label", `Question ${i + 1}${state.answers[i] ? " (answered)" : ""}`);
      els.pips.appendChild(pip);
    });
  }

  /* ---- Scoring: apply a speed/streak multiplier ---------------------------
     Answering within 8 seconds counts as "fast" and extends the streak;
     each streak step adds +10% to the points awarded for THAT answer,
     capped at +50%. A slow answer resets the streak to zero. This is the
     "dynamic speed/streak multiplier" required by the brief. */
  function scoreAnswer(question, basePoints) {
    const elapsed = (Date.now() - state.questionStartedAt) / 1000;
    const wasFast = elapsed <= 8;

    if (wasFast) {
      state.streak += 1;
    } else {
      state.streak = 0;
    }

    const multiplier = 1 + Math.min(state.streak * 0.1, 0.5);
    const finalPoints = basePoints * multiplier;

    state.scores[question.category] += finalPoints;
    state.answers[state.currentIndex] = {
      questionId: question.id,
      category: question.category,
      basePoints,
      multiplier: Number(multiplier.toFixed(2)),
      finalPoints: Number(finalPoints.toFixed(2)),
      elapsedSeconds: Number(elapsed.toFixed(1)),
    };
  }

  /* ---- Question rendering -------------------------------------------------- */
  function renderQuestion() {
    if (state.locked) return;
    const q = SSA_QUESTIONS[state.currentIndex];
    state.questionStartedAt = Date.now();
    state.pendingAnswer = null;
    els.questionCounter.textContent = `Question ${state.currentIndex + 1} of ${SSA_QUESTIONS.length}`;

    // Reset the Next button for the new question: disabled until a choice
    // is made, and labelled "Finish" on the last question.
    els.nextBtn.disabled = true;
    els.nextBtn.textContent =
      state.currentIndex === SSA_QUESTIONS.length - 1 ? "Finish quiz →" : "Next question →";

    let html = `
      <span class="badge rounded-pill mb-3" style="background:${SSA_SKILLS[q.category].color}; color:#1B2A41;">
        ${SSA_SKILLS[q.category].label}
      </span>
      <h2 class="h4 mb-4">${q.prompt}</h2>
    `;

    if (q.type === "choice") {
      html += renderChoiceOptions(q);
    } else if (q.type === "hotspot") {
      html += renderHotspot(q);
    } else if (q.type === "audio") {
      html += renderAudioQuestion(q);
    } else if (q.type === "video") {
      html += renderVideoQuestion(q);
    }

    els.cardBody.innerHTML = html;
    attachQuestionHandlers(q);
    renderPips();
  }

  function renderChoiceOptions(q) {
    return q.options
      .map(
        (opt, i) => `
      <button type="button" class="quiz-option" data-points="${opt.points}" data-index="${i}">
        ${opt.text}
      </button>`
      )
      .join("");
  }

  // Image-hotspot question rendered as an inline SVG scene (no external
  // image download required) with clickable <rect>/<circle> regions —
  // satisfies "coordinate detection or SVG overlays".
  function renderHotspot(q) {
    return `
      <div class="hotspot-wrap mb-2">
        <svg viewBox="0 0 400 220" role="img" aria-label="Team meeting scene">
          <rect width="400" height="220" fill="#EEECE5"/>
          <rect x="40" y="150" width="320" height="12" rx="6" fill="#C9C4B6"/>
          <!-- Person A: leaning in, engaged -->
          <circle cx="90" cy="95" r="22" fill="#F2A541"/>
          <rect x="65" y="118" width="50" height="55" rx="10" fill="#1B2A41"/>
          <!-- Person B: on phone, arms crossed -->
          <circle cx="180" cy="90" r="22" fill="#2EC4B6"/>
          <rect x="155" y="113" width="50" height="55" rx="10" fill="#34445E"/>
          <rect x="168" y="128" width="18" height="10" fill="#1B2A41"/>
          <!-- Person C: slouched, distracted -->
          <circle cx="270" cy="105" r="22" fill="#E85D4E"/>
          <rect x="245" y="128" width="50" height="45" rx="10" fill="#6C63A6"/>
          <!-- Person D: quietly taking notes -->
          <circle cx="330" cy="98" r="22" fill="#6C63A6"/>
          <rect x="305" y="121" width="50" height="52" rx="10" fill="#1B2A41"/>
          <rect x="312" y="150" width="36" height="22" fill="#F7F6F2"/>

          <rect class="hotspot-region" data-region="leanIn" data-points="4" x="55" y="65" width="70" height="115" rx="14"/>
          <rect class="hotspot-region" data-region="phone" data-points="1" x="145" y="60" width="70" height="115" rx="14"/>
          <rect class="hotspot-region" data-region="slouch" data-points="1" x="235" y="75" width="70" height="105" rx="14"/>
          <rect class="hotspot-region" data-region="notes" data-points="3" x="295" y="68" width="70" height="112" rx="14"/>
        </svg>
      </div>
      <p class="text-muted small">Click directly on one of the four people in the scene.</p>
    `;
  }

  function renderAudioQuestion(q) {
    return `
      <p class="text-muted small mb-2">${q.audioCaption}</p>
      <audio id="quizAudio" src="${q.audioSrc}" preload="none"></audio>
      <div class="media-controls d-flex gap-2 mb-3">
        <button type="button" class="btn btn-ssa-outline btn-sm" id="audioPlay">▶ Play</button>
        <button type="button" class="btn btn-ssa-outline btn-sm" id="audioPause">⏸ Pause</button>
        <button type="button" class="btn btn-ssa-outline btn-sm" id="audioReplay">⟲ Replay</button>
      </div>
      <div id="audioOptions" class="opacity-50">
        ${renderChoiceOptions(q)}
      </div>
      <p id="audioHint" class="text-muted small">Play the clip at least once to unlock the answer options.</p>
    `;
  }

  function renderVideoQuestion(q) {
    return `
      <video id="quizVideo" width="100%" class="rounded mb-2" src="${q.videoSrc}" controls></video>
      <p class="text-muted small">The clip will pause automatically at the decision point.</p>
      <div id="videoOptions" class="opacity-50">
        ${renderChoiceOptions(q)}
      </div>
    `;
  }

  /* ---- Per-question interaction wiring -------------------------------------- */
  function attachQuestionHandlers(q) {
    if (q.type === "choice") {
      els.cardBody.querySelectorAll(".quiz-option").forEach((btn) => {
        btn.addEventListener("click", () => selectChoice(btn, q));
      });
    }

    if (q.type === "hotspot") {
      els.cardBody.querySelectorAll(".hotspot-region").forEach((region) => {
        region.addEventListener("click", () => selectHotspot(region, q));
      });
    }

    if (q.type === "audio") {
      const audio = document.getElementById("quizAudio");
      const optionsWrap = document.getElementById("audioOptions");
      const hint = document.getElementById("audioHint");

      document.getElementById("audioPlay").addEventListener("click", () => audio.play());
      document.getElementById("audioPause").addEventListener("click", () => audio.pause());
      document.getElementById("audioReplay").addEventListener("click", () => {
        audio.currentTime = 0;
        audio.play();
      });

      // Custom JS control event: once playback has actually started,
      // unlock the answer options (keeps the interaction meaningfully
      // "media-gated" rather than decorative).
      audio.addEventListener("play", () => {
        optionsWrap.classList.remove("opacity-50");
        optionsWrap.querySelectorAll(".quiz-option").forEach((btn) => (btn.disabled = false));
        hint.textContent = "";
        optionsWrap.querySelectorAll(".quiz-option").forEach((btn) => {
          btn.addEventListener("click", () => selectChoice(btn, q), { once: true });
        });
      });
    }

    if (q.type === "video") {
      const video = document.getElementById("quizVideo");
      const optionsWrap = document.getElementById("videoOptions");
      let hasPausedAtPoint = false;

      // Video Scenario Question: listen for 'timeupdate' and pause
      // automatically at the pre-programmed timestamp (q.pauseAt),
      // then prompt for input before the video (conceptually) continues.
      video.addEventListener("timeupdate", () => {
        if (!hasPausedAtPoint && video.currentTime >= q.pauseAt) {
          video.pause();
          hasPausedAtPoint = true;
          optionsWrap.classList.remove("opacity-50");
          optionsWrap.querySelectorAll(".quiz-option").forEach((btn) => {
            btn.disabled = false;
            btn.addEventListener("click", () => selectChoice(btn, q), { once: true });
          });
        }
      });
    }
  }

  function selectChoice(btn, q) {
    if (state.locked) return;
    els.cardBody.querySelectorAll(".quiz-option").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    // Record the pick but don't score it yet — the student can still
    // change their answer until they press "Next".
    state.pendingAnswer = { points: Number(btn.dataset.points) };
    els.nextBtn.disabled = false;
  }

  function selectHotspot(region, q) {
    if (state.locked) return;
    els.cardBody.querySelectorAll(".hotspot-region").forEach((r) => r.classList.remove("is-picked"));
    region.classList.add("is-picked");
    state.pendingAnswer = { points: Number(region.dataset.points) };
    els.nextBtn.disabled = false;
  }

  // Fires when the student clicks "Next question →" / "Finish quiz →".
  // This is the single point where an answer is actually committed and
  // scored, and where the quiz advances or ends.
  els.nextBtn.addEventListener("click", () => {
    if (state.locked || !state.pendingAnswer) return;
    const q = SSA_QUESTIONS[state.currentIndex];
    scoreAnswer(q, state.pendingAnswer.points);

    if (state.currentIndex < SSA_QUESTIONS.length - 1) {
      state.currentIndex += 1;
      renderQuestion();
    } else {
      finishQuiz(false);
    }
  });

  /* ---- Finish & handoff to results page -------------------------------------- */
  function finishQuiz(timedOut) {
    clearInterval(timerHandle);

    const payload = {
      scores: state.scores,
      maxScores: state.maxScores,
      answers: state.answers,
      timedOut,
      timeUsedSeconds: QUIZ_DURATION_SECONDS - Math.max(secondsRemaining, 0),
      completedAt: new Date().toISOString(),
    };

    // Handoff between pages uses sessionStorage (no backend required).
    sessionStorage.setItem("ssaQuizResults", JSON.stringify(payload));

    if (!timedOut) {
      window.location.href = "results.html";
    } else {
      // Give the student a moment to see the lock banner before redirecting.
      setTimeout(() => (window.location.href = "results.html"), 1600);
    }
  }

  // Guard: a student's name should exist from the landing page form. If
  // not (e.g. they came here directly), we still let them take the quiz
  // as a guest rather than blocking the demo.
  if (!sessionStorage.getItem("ssaStudent")) {
    sessionStorage.setItem(
      "ssaStudent",
      JSON.stringify({ fullName: "Guest Student", studentId: "GUEST0000" })
    );
  }

  renderQuestion();
  startTimer();
});