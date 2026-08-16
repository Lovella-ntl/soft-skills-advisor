/* ==========================================================================
   validation.js
   Shared, reusable form-validation engine used by the Landing page form
   and the Contact & Feedback form. No alert()/confirm() popups anywhere —
   every error is rendered inline as a <small class="error-message"> that
   sits directly below its input, and every field toggles Bootstrap's
   .is-valid / .is-invalid classes in real time (on 'input' AND 'blur').
   ========================================================================== */

/* --- Regex pattern library --------------------------------------------------
   Centralised so both forms (and future ones) stay consistent. */
const SSA_PATTERNS = {
  // Full name: letters (incl. accented), spaces, hyphens and apostrophes
  // only — no digits or symbols. 2–60 chars.
  fullName: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/,

  // Institutional email: accepts the school's student-ID format
  // (e.g. student.id@bse.ac.mu) OR a standard email address, so the form
  // is usable in a demo without a real @bse.ac.mu account.
  institutionalEmail:
    /^(?:[A-Za-z]+\.[A-Za-z0-9]+@bse\.ac\.mu|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$/,

  // Student ID: 2-4 uppercase letters, then 4-8 digits, e.g. BSE20231045
  studentId: /^[A-Z]{2,4}[0-9]{4,8}$/,

  // Phone number: optional leading +, then 7-15 digits, spaces/dashes
  // allowed between groups (covers local and international formats).
  phone: /^\+?[0-9]{1,4}?[-.\s]?(?:\(?[0-9]{2,4}\)?[-.\s]?){2,4}[0-9]{2,4}$/,

  // Generic short message field: require at least 10 non-space characters
  minMessage: /^(?=(?:\s*\S){10,}).+$/s,
};

/**
 * Validate a single field against a named rule.
 * Returns { valid: boolean, message: string } — message is only used
 * when valid === false.
 */
function ssaValidateField(rule, rawValue) {
  const value = (rawValue || "").trim();

  switch (rule) {
    case "required":
      return value.length > 0
        ? { valid: true }
        : { valid: false, message: "This field can't be empty." };

    case "fullName":
      if (value.length === 0) return { valid: false, message: "Enter your full name." };
      if (!SSA_PATTERNS.fullName.test(value))
        return { valid: false, message: "Letters, spaces and hyphens only — no numbers or symbols." };
      if (value.trim().split(/\s+/).length < 2)
        return { valid: false, message: "Enter first and last name." };
      return { valid: true };

    case "institutionalEmail":
      if (value.length === 0) return { valid: false, message: "Enter your email address." };
      if (!SSA_PATTERNS.institutionalEmail.test(value))
        return { valid: false, message: "Use a valid email, e.g. student.id@bse.ac.mu" };
      return { valid: true };

    case "studentId":
      if (value.length === 0) return { valid: false, message: "Enter your student ID." };
      if (!SSA_PATTERNS.studentId.test(value.toUpperCase()))
        return { valid: false, message: "Format: 2–4 letters then 4–8 digits, e.g. BSE20231045" };
      return { valid: true };

    case "phone":
      if (value.length === 0) return { valid: false, message: "Enter a phone number." };
      if (!SSA_PATTERNS.phone.test(value))
        return { valid: false, message: "Enter a valid phone number, e.g. +230 5712 3456" };
      return { valid: true };

    case "minMessage":
      if (value.length === 0) return { valid: false, message: "This field can't be empty." };
      if (!SSA_PATTERNS.minMessage.test(value))
        return { valid: false, message: "Please write at least 10 characters." };
      return { valid: true };

    case "select":
      return value.length > 0
        ? { valid: true }
        : { valid: false, message: "Please choose an option." };

    default:
      return { valid: true };
  }
}

/**
 * Wire up one <input>/<textarea>/<select> for real-time validation.
 * Expects the field to have:
 *   data-rule="fullName|institutionalEmail|studentId|phone|minMessage|select|required"
 * and a sibling element matching `${field.id}-error` to receive the message.
 */
function ssaBindField(field) {
  const rule = field.dataset.rule;
  if (!rule) return;

  const errorEl = document.getElementById(`${field.id}-error`);

  const runValidation = () => {
    const result = ssaValidateField(rule, field.value);

    // Toggle Bootstrap-style state classes so borders/icons update live.
    field.classList.remove("is-valid", "is-invalid");
    if (field.value.trim().length === 0 && !field.dataset.touched) {
      // Don't shame an untouched, empty field before the user has
      // interacted with it — only mark it once they've engaged with it.
    } else if (result.valid) {
      field.classList.add("is-valid");
    } else {
      field.classList.add("is-invalid");
    }

    if (errorEl) {
      errorEl.textContent = field.dataset.touched && !result.valid ? result.message : "";
    }

    field.setAttribute("aria-invalid", String(!result.valid));
    return result.valid;
  };

  // Validate as the user types (debounced lightly via input event is fine
  // for this scale of form) and again when focus leaves the field.
  field.addEventListener("input", () => {
    field.dataset.touched = "true";
    runValidation();
  });
  field.addEventListener("blur", () => {
    field.dataset.touched = "true";
    runValidation();
  });

  // Expose the check so the form's submit handler can force full validation.
  field.__ssaRunValidation = runValidation;
}

/**
 * Bind an entire form: every [data-rule] field inside it, plus a submit
 * handler that re-validates everything and blocks submission on failure.
 * onValid is called with a plain object of { fieldName: value } once every
 * field passes.
 */
function ssaBindForm(formEl, onValid) {
  const fields = Array.from(formEl.querySelectorAll("[data-rule]"));
  fields.forEach(ssaBindField);

  formEl.addEventListener("submit", (event) => {
    event.preventDefault(); // never rely on native/browser popups

    let allValid = true;
    fields.forEach((field) => {
      field.dataset.touched = "true";
      const valid = field.__ssaRunValidation();
      if (!valid) allValid = false;
    });

    if (!allValid) {
      // Focus the first invalid field for accessibility/usability.
      const firstInvalid = fields.find((f) => f.classList.contains("is-invalid"));
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = {};
    fields.forEach((f) => (data[f.name || f.id] = f.value.trim()));
    onValid(data);
  });
}