/* ==========================================================================
   landing.js
   Wires the Landing page's "Get Started" registration form to the shared
   validation engine, then stores the student's details in sessionStorage
   and routes them into the quiz.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("startForm");

  ssaBindForm(form, (data) => {
    // Persist details for use on the Assessment + Results pages.
    sessionStorage.setItem(
      "ssaStudent",
      JSON.stringify({
        fullName: data.fullName,
        email: data.email,
      })
    );
    window.location.href = "quiz.html";
  });
});