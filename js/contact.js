/* ==========================================================================
   contact.js
   Wires the Contact & Feedback form to the shared validation engine
   (validation.js) and shows a genuine inline success state on submit —
   still no alert()/confirm() popups.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const successBanner = document.getElementById("contactSuccess");

  ssaBindForm(form, (data) => {
    // No backend in this static demo — we simulate a successful send by
    // revealing an inline confirmation and resetting the form/state.
    successBanner.classList.remove("d-none");
    successBanner.textContent = `Thanks, ${data.contactName.split(" ")[0]} — your message has been recorded. We'll reply to ${data.contactEmail}.`;
    form.reset();
    form.querySelectorAll(".is-valid, .is-invalid").forEach((f) => {
      f.classList.remove("is-valid", "is-invalid");
      delete f.dataset.touched;
    });
    form.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
    successBanner.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});