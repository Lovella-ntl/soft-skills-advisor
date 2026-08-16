/* ==========================================================================
   results.js
   Reads the quiz payload from sessionStorage, renders the per-skill
   breakdown + feedback + next steps, and draws a dynamic radar (spider)
   chart on <canvas> using the raw Canvas 2D API — no chart libraries.
   A short particle "celebration" animation also runs on the same canvas
   frame if the student's overall score is strong.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("ssaQuizResults");
  const student = JSON.parse(sessionStorage.getItem("ssaStudent") || "{}");

  const emptyState = document.getElementById("noResultsState");
  const resultsWrap = document.getElementById("resultsWrap");

  if (!raw) {
    // No quiz data in this session — show a friendly empty state instead
    // of a blank/broken page.
    emptyState.classList.remove("d-none");
    resultsWrap.classList.add("d-none");
    return;
  }

  const data = JSON.parse(raw);
  document.getElementById("studentNameOut").textContent = student.fullName || "Student";

  /* ---- Convert raw scores to percentages of max ---------------------------- */
  const categories = Object.keys(SSA_SKILLS);
  const percentages = {};
  categories.forEach((cat) => {
    const max = data.maxScores[cat] || 1;
    percentages[cat] = Math.round((data.scores[cat] / max) * 100);
  });

  const overallPct = Math.round(
    categories.reduce((sum, cat) => sum + percentages[cat], 0) / categories.length
  );
  document.getElementById("overallScoreOut").textContent = `${overallPct}%`;
  document.getElementById("timeUsedOut").textContent = `${Math.floor(data.timeUsedSeconds / 60)}m ${data.timeUsedSeconds % 60}s`;
  if (data.timedOut) {
    document.getElementById("timeoutNotice").classList.remove("d-none");
  }

  /* ---- Render per-skill rows: bar, tier, feedback, next step ---------------- */
  const listEl = document.getElementById("skillBreakdown");
  categories.forEach((cat) => {
    const pct = percentages[cat];
    const fb = ssaGetFeedback(cat, pct);
    const row = document.createElement("div");
    row.className = "result-skill-row";
    row.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong>${SSA_SKILLS[cat].label}</strong>
        <span class="badge" style="background:${SSA_SKILLS[cat].color}; color:#1B2A41;">${fb.tier} · ${pct}%</span>
      </div>
      <div class="result-skill-bar mb-2">
        <span style="width:${pct}%; background:${SSA_SKILLS[cat].color};"></span>
      </div>
      <p class="mb-1 small">${fb.text}</p>
      <p class="mb-0 small text-muted"><strong>Next step:</strong> ${fb.next}</p>
    `;
    listEl.appendChild(row);
  });

  /* ---- Canvas: radar/spider chart ------------------------------------------- */
  drawRadarChart(percentages);

  // Celebration particles only fire for a strong overall result — reserving
  // the moment so it means something rather than always playing.
  if (overallPct >= 70) {
    runConfetti();
  }

  /* ==========================================================================
     drawRadarChart
     Draws a 4-axis radar chart (Communication / Critical Thinking /
     Time Management / Leadership) on <canvas> using plain 2D context calls:
     grid rings, axis labels, and a filled polygon representing the
     student's scores. Built from scratch — no chart library.
     ========================================================================== */
  function drawRadarChart(pcts) {
    const canvas = document.getElementById("radarCanvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Support HiDPI screens without blurring: scale the backing store,
    // not just the CSS size.
    const size = 420;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size / 2 - 60;
    const axes = categories; // 4 axes, evenly spaced
    const angleStep = (Math.PI * 2) / axes.length;
    const rings = 4; // 25 / 50 / 75 / 100 %

    ctx.clearRect(0, 0, size, size);

    // --- Background grid rings ---
    ctx.strokeStyle = "#DCD9D0";
    ctx.lineWidth = 1;
    for (let r = 1; r <= rings; r++) {
      const ringRadius = (radius / rings) * r;
      ctx.beginPath();
      axes.forEach((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = center + ringRadius * Math.cos(angle);
        const y = center + ringRadius * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    }

    // --- Axis spokes + labels ---
    ctx.fillStyle = "#1B2A41";
    ctx.font = "600 13px Inter, sans-serif";
    axes.forEach((cat, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#DCD9D0";
      ctx.stroke();

      const labelX = center + (radius + 26) * Math.cos(angle);
      const labelY = center + (radius + 26) * Math.sin(angle);
      ctx.textAlign = "center";
      ctx.fillText(SSA_SKILLS[cat].label, labelX, labelY);
    });

    // --- Data polygon (the student's actual profile) ---
    ctx.beginPath();
    axes.forEach((cat, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const value = Math.max(pcts[cat], 4) / 100; // floor so 0% is still visible
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(242, 165, 65, 0.35)";
    ctx.strokeStyle = "#F2A541";
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    // --- Data point dots ---
    axes.forEach((cat, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const value = Math.max(pcts[cat], 4) / 100;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = SSA_SKILLS[cat].color;
      ctx.fill();
    });
  }

  /* ==========================================================================
     runConfetti
     A small dynamic particle system (positions, velocity, gravity, and
     fade) animated with requestAnimationFrame directly on the 2D canvas
     context — a lightweight, from-scratch alternative to the radar chart
     for the "celebration engine" option in the brief.
     ========================================================================== */
  function runConfetti() {
    const canvas = document.getElementById("confettiCanvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = 420, h = 140;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    const colors = ["#F2A541", "#2EC4B6", "#E85D4E", "#6C63A6"];
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * 60,
      r: 3 + Math.random() * 3,
      vy: 1.5 + Math.random() * 2,
      vx: -1 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));

    let frame = 0;
    const maxFrames = 130;

    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.life = Math.max(0, 1 - frame / maxFrames);

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (frame < maxFrames) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
});