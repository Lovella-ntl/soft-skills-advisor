/* ==========================================================================
   canvas.js
   Renders the Results-page radar/spider chart using the raw Canvas 2D API.
   No external charting library is used, per assignment constraints.
   ========================================================================== */

/**
 * Draw a 4-axis radar chart of category percentages.
 * @param {HTMLCanvasElement} canvas
 * @param {{label:string, value:number}[]} data - value is 0-100
 */
function drawRadarChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Render at device pixel ratio for crisp lines on high-DPI screens
  const cssSize = canvas.clientWidth || 480;
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  ctx.scale(dpr, dpr);

  const size = cssSize;
  const center = size / 2;
  const radius = size * 0.34;
  const axisCount = data.length;
  const angleStep = (Math.PI * 2) / axisCount;

  ctx.clearRect(0, 0, size, size);

  // ---- grid rings (25/50/75/100%) ----
  ctx.strokeStyle = 'rgba(247, 236, 230, 0.15)';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1].forEach((ring) => {
    ctx.beginPath();
    for (let i = 0; i <= axisCount; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = radius * ring;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  // ---- axis spokes + labels ----
  ctx.strokeStyle = 'rgba(247, 236, 230, 0.25)';
  ctx.fillStyle = '#f7ece6';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.textAlign = 'center';

  data.forEach((point, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(x, y);
    ctx.stroke();

    const labelX = center + (radius + 26) * Math.cos(angle);
    const labelY = center + (radius + 26) * Math.sin(angle);
    ctx.fillText(point.label, labelX, labelY);
    ctx.fillStyle = '#e2452f';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(`${Math.round(point.value)}%`, labelX, labelY + 14);
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillStyle = '#f7ece6';
  });

  // ---- animated fill polygon (grows from 0 to actual value) ----
  let progress = 0;
  function frame() {
    progress = Math.min(1, progress + 0.035);

    // redraw just the polygon layer over the static grid each frame
    ctx.save();
    ctx.beginPath();
    data.forEach((point, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = radius * (point.value / 100) * progress;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(226, 69, 47, 0.35)';
    ctx.strokeStyle = '#e2452f';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(() => {
        // Clear only the inner chart area, then redraw grid+polygon for animation
        ctx.clearRect(0, 0, size, size);
        drawStaticLayer();
        frame();
      });
    }
  }

  function drawStaticLayer() {
    ctx.strokeStyle = 'rgba(247, 236, 230, 0.15)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach((ring) => {
      ctx.beginPath();
      for (let i = 0; i <= axisCount; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const r = radius * ring;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(247, 236, 230, 0.25)';
    ctx.fillStyle = '#f7ece6';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    data.forEach((point, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(x, y);
      ctx.stroke();
      const labelX = center + (radius + 26) * Math.cos(angle);
      const labelY = center + (radius + 26) * Math.sin(angle);
      ctx.fillText(point.label, labelX, labelY);
      ctx.fillStyle = '#e2452f';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText(`${Math.round(point.value)}%`, labelX, labelY + 14);
      ctx.font = '600 12px Inter, sans-serif';
      ctx.fillStyle = '#f7ece6';
    });
  }

  requestAnimationFrame(frame);
}

window.drawRadarChart = drawRadarChart;