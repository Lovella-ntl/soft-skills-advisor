/* ==========================================================================
   email.js
   Sends a copy of the results to the student's institutional email.

   A static site hosted on GitHub Pages has no server, so it cannot send
   SMTP mail directly. This uses EmailJS (a client-side email API with a
   free tier) to deliver the message. If EmailJS is not configured, it
   falls back to opening the user's mail client via a mailto: link so the
   feature still "works" end-to-end for the demo.

   SETUP (see README.md "Email delivery" section):
     1. Create a free account at https://www.emailjs.com
     2. Create an Email Service + Template, then fill in the three
        constants below with your own IDs. Never commit real secret keys
        to a public repo beyond the EmailJS *public* key, which is safe
        to expose client-side by design.
   ========================================================================== */

const EMAILJS_CONFIG = {
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
};

function isEmailJsConfigured() {
  return !Object.values(EMAILJS_CONFIG).some((v) => v.startsWith('YOUR_'));
}

/**
 * Send the results summary to the student's email.
 * @param {{name:string, studentId:string, email:string, summaryText:string, categories:Object}} payload
 * @returns {Promise<{ok:boolean, mode:'emailjs'|'mailto', error?:string}>}
 */
async function sendResultsEmail(payload) {
  if (isEmailJsConfigured() && window.emailjs) {
    try {
      await window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
        to_name: payload.name,
        to_email: payload.email,
        student_id: payload.studentId,
        results_summary: payload.summaryText,
      }, EMAILJS_CONFIG.publicKey);
      return { ok: true, mode: 'emailjs' };
    } catch (err) {
      console.error('EmailJS send failed, falling back to mailto:', err);
    }
  }

  // Fallback: open a pre-filled mailto so the user can send it themselves
  const subject = encodeURIComponent('Your Soft Skills Advisor Results');
  const body = encodeURIComponent(payload.summaryText);
  window.location.href = `mailto:${payload.email}?subject=${subject}&body=${body}`;
  return { ok: true, mode: 'mailto' };
}

window.sendResultsEmail = sendResultsEmail;