/* ==========================================================================
   main.js
   Shared behavior across pages:
   - Ember background particles (purely decorative, respects reduced-motion)
   - Landing page: profile form validation + handoff into the quiz
   - Contact page: feedback form validation + confirmation state
   ========================================================================== */

const { PATTERNS, bindValidation, isValidEmail } = window.SSA_VALIDATION;

/* ---- decorative ember particles (skipped politely for reduced motion) --- */
(function spawnEmbers() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const field = document.querySelector('.ember-field');
  if (!field || prefersReduced) return;

  const EMBER_COUNT = 18;
  for (let i = 0; i < EMBER_COUNT; i++) {
    const el = document.createElement('span');
    el.className = 'ember';
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${8 + Math.random() * 10}s`;
    el.style.animationDelay = `${Math.random() * 10}s`;
    el.style.opacity = (0.2 + Math.random() * 0.3).toFixed(2);
    field.appendChild(el);
  }
})();

/* ---- Landing page: student profile form ---- */
const profileForm = document.getElementById('profileForm');
if (profileForm) {
  const checks = {
    name: bindValidation('#studentName', PATTERNS.name, 'Use your full name, letters only (e.g. Jane Doe).'),
    id: bindValidation('#studentId', PATTERNS.studentId, 'Format: BSE2024-0451 or an 6-10 digit numeric ID.'),
    email: bindValidation('#studentEmail', isValidEmail, 'Use your institutional email, e.g. jane.doe@bse.ac.mu.'),
  };

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Force-touch every field so hidden errors surface on submit attempts
    profileForm.querySelectorAll('input').forEach((i) => (i.dataset.touched = 'true'));
    const results = Object.values(checks).map((fn) => fn());
    if (results.every(Boolean)) {
      const profile = {
        name: document.getElementById('studentName').value.trim(),
        studentId: document.getElementById('studentId').value.trim(),
        email: document.getElementById('studentEmail').value.trim(),
      };
      sessionStorage.setItem('ssa_profile', JSON.stringify(profile));
      window.location.href = 'quiz.html';
    }
  });
}

/* ---- Contact page: feedback form ---- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const checks = {
    name: bindValidation('#contactName', PATTERNS.name, 'Letters only, e.g. Jane Doe.'),
    email: bindValidation('#contactEmail', isValidEmail, 'Enter a valid email address.'),
    phone: bindValidation('#contactPhone', PATTERNS.phone, 'Use a valid phone format, e.g. +230 5123 4567.'),
    message: bindValidation('#contactMessage', PATTERNS.minMessage, 'Message must be at least 10 characters.'),
  };

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactForm.querySelectorAll('input, textarea').forEach((i) => (i.dataset.touched = 'true'));
    const results = Object.values(checks).map((fn) => fn());
    if (results.every(Boolean)) {
      contactForm.hidden = true;
      document.getElementById('contactSuccess').hidden = false;
    }
  });
}