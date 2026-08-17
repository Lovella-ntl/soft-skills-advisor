/* ==========================================================================
   validation.js
   Reusable, dependency-free inline form validation engine.
   - Regex patterns for name / student ID / institutional email / phone
   - Attaches to `input` + `blur` events for real-time feedback
   - Toggles .is-valid / .is-invalid and shows/hides .error-message
   No alert()/confirm() is ever used — all feedback renders inline.
   ========================================================================== */

const PATTERNS = {
  // Letters, spaces, hyphens and apostrophes only (no digits/specials)  2 to 60 chars
  name: /^[A-Za-z][A-Za-z'-]*(?:\s[A-Za-z][A-Za-z'-]*)+$/,

  // Institutional format: student.id@bse.ac.mu  OR a general fallback email
  institutionalEmail: /^[a-zA-Z]+\.[a-zA-Z0-9]+@bse\.ac\.mu$/,
  genericEmail: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

  // Student ID e.g. BSE2024-0451 or 8 digit numeric ID
  studentId: /^(?:[A-Z]{2,4}\d{4}-\d{3,5}|\d{6,10})$/,

  // Phone: optional +230 country code, 7-8 digits, spaces allowed
  phone: /^(?:\+\d{1,3}[ -]?)?\d{3,4}[ -]?\d{4}$/,

  // Generic short message: at least 10 non-whitespace characters
  minMessage: /^(?=(?:\S\s*){10,}).+$/s,
};

/**
 * Validate a single field against a named pattern and update its UI state.
 * @param {HTMLInputElement|HTMLTextAreaElement} input
 * @param {RegExp|Function} rule - regex to test, or a predicate function
 * @param {string} message - error text shown when invalid
 */
function validateField(input, rule, message) {
  const wrapper = input.closest('.field');
  const errorEl = wrapper ? wrapper.querySelector('.error-message') : null;
  const value = input.value.trim();

  const isEmpty = value.length === 0;
  const passes = isEmpty ? false : (typeof rule === 'function' ? rule(value) : rule.test(value));

  if (passes) {
    input.classList.add('is-valid');
    input.classList.remove('is-invalid');
    input.setAttribute('aria-invalid', 'false');
    if (errorEl) errorEl.classList.remove('show');
    return true;
  }

  input.classList.remove('is-valid');
  // Only flag red once the user has interacted (avoids shouting on first paint)
  if (input.dataset.touched === 'true') {
    input.classList.add('is-invalid');
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = isEmpty ? 'This field is required.' : message;
      errorEl.classList.add('show');
    }
  }
  return false;
}

/**
 * Wire up a field with live validation on input + blur.
 * @param {string} selector - CSS selector for the input
 * @param {RegExp|Function} rule
 * @param {string} message
 * @param {Function} [onChange] - optional callback(isValid)
 */
function bindValidation(selector, rule, message, onChange) {
  const input = document.querySelector(selector);
  if (!input) return;

  const run = () => {
    const ok = validateField(input, rule, message);
    if (typeof onChange === 'function') onChange(ok);
    return ok;
  };

  input.addEventListener('blur', () => { input.dataset.touched = 'true'; run(); });
  input.addEventListener('input', () => { if (input.dataset.touched === 'true') run(); });

  return run;
}

/**
 * Institutional-or-generic email check used by validateForm helpers.
 */
function isValidEmail(value) {
  return PATTERNS.institutionalEmail.test(value) || PATTERNS.genericEmail.test(value);
}

// Export to window so plain <script> includes on every page can use it
window.SSA_VALIDATION = { PATTERNS, validateField, bindValidation, isValidEmail };