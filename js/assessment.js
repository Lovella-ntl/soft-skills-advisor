/* ==========================================================================
   assessment.js
   Engine for the Likert-scale assessment: enforces the "must register
   first" gate, renders the 20-statement table, tracks live answer
   progress, runs a 20-minute countdown timer with timeout lock/auto-submit,
   and computes a 0-100% score per value on submit.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Registration gate ---------------------------------------------------
     The assessment can only be taken after the Landing page form has been
     submitted (name + email stored in sessionStorage). If someone lands
     here directly, send them back rather than letting them proceed
     anonymously — per the "only take the quiz after filling in their
     name/email" requirement. */
  const studentRaw = sessionStorage.getItem("ssaStudent");
  if (!studentRaw) {
    window.location.href = "index.html?required=1";
    return;
  }
  const student = JSON.parse(studentRaw);

  const state = {
    locked: false,
    answers: {}, // statementId -> selected value (1-5)
  };

  const els = {
    tableBody: document.getElementById("likertTableBody"),
    progressBar: document.getElementById("answerProgressBar"),
    progressLabel: document.getElementById("answerProgressLabel"),
    timer: document.getElementById("assessmentTimer"),
    lockBanner: document.getElementById("lockBanner"),
    submitBtn: document.getElementById("submitAssessmentBtn"),
    studentGreeting: document.getElementById("studentGreeting"),
  };

  els.studentGreeting.textContent = `Hi ${student.fullName.split(" ")[0]}, your responses are linked to ${student.email}.`;

  /* ---- Render the 20-statement Likert table --------------------------------- */
  function renderTable() {
    els.tableBody.innerHTML = SSA_STATEMENTS.map((stmt) => {
      const skill = SSA_SKILLS[stmt.category];
      const radios = SSA_SCALE
        .map(
          (opt) => `
        <td class="likert-radio-cell">
          <input type="radio" name="${stmt.id}" value="${opt.value}"
                 aria-label="${opt.label} — ${stmt.text}">
        </td>`
        )
        .join("");

      return `
        <tr id="row-${stmt.id}" data-statement="${stmt.id}">
          <td class="likert-statement-cell">
            <span class="likert-category-tag" style="background:${skill.color}33; color:${skill.color === '#F2A541' ? '#7a5000' : skill.color};">
              ${skill.label}
            </span>
            ${stmt.text}
          </td>
          ${radios}
        </tr>`;
    }).join("");

    // One change-listener per row via delegation, rather than 100 listeners.
    els.tableBody.addEventListener("change", handleAnswerChange);
  }

  function handleAnswerChange(event) {
    if (state.locked) return;
    const input = event.target;
    if (input.type !== "radio") return;

    const statementId = input.name;
    state.answers[statementId] = Number(input.value);

    const row = document.getElementById(`row-${statementId}`);
    row.classList.add("is-answered");

    updateProgress();
  }

  function updateProgress() {
    const answeredCount = Object.keys(state.answers).length;
    const total = SSA_STATEMENTS.length;
    const pct = Math.round((answeredCount / total) * 100);

    els.progressBar.style.width = `${pct}%`;
    els.progressLabel.textContent = `${answeredCount} of ${total} statements answered`;
    els.submitBtn.disabled = answeredCount === 0; // allow partial submit on purpose (timeout parity)
  }

  /* ---- Countdown timer: 20 minutes -----------------------------------------
     Built with setInterval/clearInterval per the assignment's client-side
     timer requirement. Warning state in the final 60 seconds; on timeout,
     every radio input is locked and the current answers are auto-submitted. */
  const ASSESSMENT_DURATION_SECONDS = 20 * 60; // 20 minutes
  let secondsRemaining = ASSESSMENT_DURATION_SECONDS;
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

      if (secondsRemaining <= 60 && secondsRemaining > 0) {
        els.timer.classList.add("timer-warning");
      }

      if (secondsRemaining <= 0) {
        clearInterval(timerHandle);
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    state.locked = true;
    els.timer.textContent = "0:00";
    els.timer.classList.remove("timer-warning");
    els.timer.classList.add("timer-locked");

    document.getElementById("assessmentForm").classList.add("timeout-locked");
    els.submitBtn.disabled = true;
    els.lockBanner.classList.remove("d-none");

    finishAssessment(true);
  }

  /* ---- Scoring: sum per category, expressed as a percentage of max --------- */
  function computeScores() {
    const totals = { communication: 0, critical: 0, time: 0, leadership: 0 };
    const maxima = { communication: 0, critical: 0, time: 0, leadership: 0 };

    SSA_STATEMENTS.forEach((stmt) => {
      maxima[stmt.category] += 5; // max points per statement = 5 (Strongly Agree)
      if (state.answers[stmt.id]) {
        totals[stmt.category] += state.answers[stmt.id];
      }
    });

    const percentages = {};
    Object.keys(totals).forEach((cat) => {
      percentages[cat] = Math.round((totals[cat] / maxima[cat]) * 100);
    });

    return { totals, maxima, percentages };
  }

  function finishAssessment(timedOut) {
    clearInterval(timerHandle);
    const { totals, maxima, percentages } = computeScores();

    const payload = {
      percentages,
      totals,
      maxima,
      answeredCount: Object.keys(state.answers).length,
      totalStatements: SSA_STATEMENTS.length,
      timedOut,
      timeUsedSeconds: ASSESSMENT_DURATION_SECONDS - Math.max(secondsRemaining, 0),
      completedAt: new Date().toISOString(),
    };

    sessionStorage.setItem("ssaAssessmentResults", JSON.stringify(payload));

    if (!timedOut) {
      window.location.href = "results.html";
    } else {
      setTimeout(() => (window.location.href = "results.html"), 1800);
    }
  }

  els.submitBtn.addEventListener("click", () => {
    if (state.locked) return;
    finishAssessment(false);
  });

  renderTable();
  updateProgress();
  startTimer();
});