/* ==========================================================================
   results.js
   Reads the assessment payload from sessionStorage, renders the per-value
   percentage breakdown with a below-60% recommendation callout, draws the
   Canvas radar chart + celebration particles, and wires up an "email me
   my results" action.

   NOTE on emailing results: a static GitHub Pages site has no backend, so
   it cannot send real emails on its own. This uses a mailto: link, which
   opens the student's own email client with the results pre-filled and
   addressed to themselves — it works with zero configuration. See the
   README for how to upgrade this to fully automatic sending via a free
   client-side email service (e.g. EmailJS) if you want that instead.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("ssaAssessmentResults");
  const student = JSON.parse(sessionStorage.getItem("ssaStudent") || "{}");

  const emptyState = document.getElementById("noResultsState");
  const resultsWrap = document.getElementById("resultsWrap");

  if (!raw) {
    emptyState.classList.remove("d-none");
    resultsWrap.classList.add("d-none");
    return;
  }

  const data = JSON.parse(raw);
  const categories = Object.keys(SSA_SKILLS);
  const percentages = data.percentages;

  document.getElementById("studentNameOut").textContent = student.fullName || "Student";

  const overallPct = Math.round(
    categories.reduce((sum, cat) => sum + percentages[cat], 0) / categories.length
  );
  document.getElementById("overallScoreOut").textContent = `${overallPct}%`;
  document.getElementById("timeUsedOut").textContent =
    `${Math.floor(data.timeUsedSeconds / 60)}m ${data.timeUsedSeconds % 60}s`;
  document.getElementById("answeredOut").textContent =
    `${data.answeredCount} of ${data.totalStatements}`;

  if (data.timedOut) {
    document.getElementById("timeoutNotice").classList.remove("d-none");
  }

  /* ---- Render per-value rows: bar, percentage, recommendation -------------- */
  const listEl = document.getElementById("skillBreakdown");
  categories.forEach((cat) => {
    const pct = percentages[cat];
    const rec = ssaGetRecommendation(cat, pct);
    const row = document.createElement("div");
    row.className = "result-skill-row" + (rec.needsImprovement ? " needs-improvement" : "");
    row.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong>${SSA_SKILLS[cat].label}</strong>
        <span class="badge" style="background:${SSA_SKILLS[cat].color}; color:#1c0d0f;">${pct}%</span>
      </div>
      <div class="result-skill-bar mb-2">
        <span style="width:${pct}%; background:${SSA_SKILLS[cat].color};"></span>
      </div>
      ${
        rec.needsImprovement
          ? `<div class="recommendation-box"><strong>Below 60% — recommendation:</strong> ${rec.text}</div>`
          : `<p class="mb-0 small text-muted">${rec.text}</p>`
      }
    `;
    listEl.appendChild(row);
  });

  drawRadarChart(percentages, categories);
  if (overallPct >= 70) runConfetti();

  /* ---- Email my results (mailto: — no backend required) -------------------- */
  const emailBtn = document.getElementById("emailResultsBtn");
  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const lines = categories.map(
        (cat) => `${SSA_SKILLS[cat].label}: ${percentages[cat]}%`
      );
      const subject = "Your Soft Skills Advisor Results";
      const body =
        `Hi ${student.fullName || "there"},\n\n` +
        `Here is a copy of your Soft Skills Advisor results:\n\n` +
        lines.join("\n") +
        `\n\nOverall score: ${overallPct}%\n\n` +
        `— Soft Skills Advisor`;

      const mailtoUrl = `mailto:${encodeURIComponent(student.email || "")}` +
        `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoUrl;
    });
  }

  /* ==========================================================================
     drawRadarChart — 4-axis radar chart on <canvas>, plain 2D context calls,
     no chart library. Identical technique to the original build, just fed
     percentages directly instead of deriving them from raw scores.
     ========================================================================== */
  function drawRadarChart(pcts, axes) {
    const canvas = document.getElementById("radarCanvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 420;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const radius = size / 2 - 60;
    const angleStep = (Math.PI * 2) / axes.length;
    const rings = 4;

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "#E4D6D4";
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

    ctx.fillStyle = "#1C0D0F";
    ctx.font = "600 13px Inter, sans-serif";
    axes.forEach((cat, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#E4D6D4";
      ctx.stroke();

      const labelX = center + (radius + 26) * Math.cos(angle);
      const labelY = center + (radius + 26) * Math.sin(angle);
      ctx.textAlign = "center";
      ctx.fillText(SSA_SKILLS[cat].label, labelX, labelY);
    });

    ctx.beginPath();
    axes.forEach((cat, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const value = Math.max(pcts[cat], 4) / 100;
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(139, 30, 36, 0.28)";
    ctx.strokeStyle = "#8B1E24";
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

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
     runConfetti — from-scratch particle celebration on <canvas>, using
     requestAnimationFrame with position/velocity/gravity/fade per particle.
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

    const colors = ["#8B1E24", "#2EC4B6", "#E85D4E", "#6C63A6", "#F2A541"];
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
        p.vy += 0.03;
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
