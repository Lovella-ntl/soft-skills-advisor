/* ==========================================================================
   timer.js
   Client-side countdown timer built on setInterval()/clearInterval().
   Used by the quiz page: 30-minute countdown, 5-minute warning state,
   and an onExpire callback that the quiz uses to auto-submit.
   ========================================================================== */

class CountdownTimer {
  /**
   * @param {Object} opts
   * @param {number} opts.durationSeconds - total countdown length
   * @param {number} opts.warningAtSeconds - remaining-time threshold that flips to "warning" state
   * @param {(remaining:number)=>void} opts.onTick - called every second with seconds remaining
   * @param {()=>void} opts.onWarning - called once, the instant the warning threshold is crossed
   * @param {()=>void} opts.onExpire - called once, when the timer hits zero
   */
  constructor({ durationSeconds, warningAtSeconds, onTick, onWarning, onExpire }) {
    this.remaining = durationSeconds;
    this.warningAt = warningAtSeconds;
    this.onTick = onTick || (() => {});
    this.onWarning = onWarning || (() => {});
    this.onExpire = onExpire || (() => {});
    this.intervalId = null;
    this.warningFired = false;
  }

  start() {
    if (this.intervalId) return; // guard against double-start
    this.onTick(this.remaining);
    this.intervalId = setInterval(() => {
      this.remaining -= 1;

      if (!this.warningFired && this.remaining <= this.warningAt) {
        this.warningFired = true;
        this.onWarning();
      }

      if (this.remaining <= 0) {
        this.remaining = 0;
        this.onTick(this.remaining);
        this.stop();
        this.onExpire();
        return;
      }

      this.onTick(this.remaining);
    }, 1000);
  }

  pause() { this.stop(); }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Format seconds as MM:SS for display in the timer chip. */
  static format(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

window.CountdownTimer = CountdownTimer;
