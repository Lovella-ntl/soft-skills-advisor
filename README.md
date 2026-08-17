# Soft Skills Advisor

Soft Skills Advisor is a static, front-end-only web application. Students register
with their name and email, then complete a 20-statement Likert-scale
self-assessment (Strongly Disagree → Strongly Agree) covering four values,
Communication, Critical Thinking, Time Management, and Leadership, and get
a percentage score per value, a radar-chart profile, and recommendations for
any value that scores below 60%.

Built with **HTML5, CSS3, vanilla JavaScript, and Bootstrap 5.3**. No backend,
no build step, no external chart libraries.


---

## 1. Project structure

```
soft-skills-advisor/
├── index.html                 Landing page — hero + name/email registration gate
├── values.html                  Explains the four values in depth
├── assessment.html               20-statement Likert table + 20-min timer
├── results.html                    Radar chart + % scores + recommendations
├── contact.html                     Contact & Feedback page
├── css/
│   └── style.css                    Dark-red theme, motion, all custom styling
├── js/
│   ├── validation.js                 Shared regex + inline-error validation
│   ├── landing.js                     Registration form → sessionStorage
│   ├── assessment-data.js              20 statements + recommendations text
│   ├── assessment.js                    Gate check, timer, table, scoring
│   ├── results.js                        Renders results + canvas + email button
│   └── contact.js                         Contact page form wiring
├── assets/
│   ├── hero-bg.mp4                        Looping abstract hero background video
│   └── hero-bg.jpg                         Poster frame for the video
```

---

## 2. How the new flow works

1. **`index.html`** student enters full name + email. On submit, this is
   saved to `sessionStorage` as `ssaStudent` and they're routed to
   `assessment.html`.
2. **`assessment.html`** checks for `ssaStudent` on load. If missing
   (someone opened this page directly), it redirects back to
   `index.html?required=1`, which shows a "please register first" notice.
   This is the **registration gate**.
3. Student rates all 20 statements against the 5-point scale in a table.
   A live progress bar shows "X of 20 answered", and a 20-minute countdown
   timer runs via `setInterval`. At 0, everything locks and whatever was
   answered is auto-submitted.
4. Scores are calculated per value (max 25 points = 5 statements × 5),
   converted to a percentage, and saved to `sessionStorage` as
   `ssaAssessmentResults`.
5. **`results.html`** reads both `ssaStudent` and `ssaAssessmentResults`,
   renders the radar chart + bars + recommendations, and offers an
   **"Email me a copy of my results"** button.

## 3. Important: how the "email results" feature actually works

GitHub Pages is 100% static  there is no server to send email from. The
**"Email me a copy of my results"** button uses a `mailto:` link: it opens
the student's own email client with the subject and full results already
typed into the body, addressed to the email they registered with. This
works instantly with zero setup, but it requires the student to actually
have a mail client configured on their device.

**If you want fully automatic sending** (no click required from the
student), the standard client-side option is
[EmailJS](https://www.emailjs.com/) (free tier available):
1. Create a free EmailJS account and an email template.
2. Add their CDN script to `results.html`.
3. In `js/results.js`, replace the `mailto:` block in the `emailResultsBtn`
   handler with an `emailjs.send(serviceId, templateId, { ...percentages })`
   call using your Service ID / Template ID / Public Key.

## 4. Important: the hero background video

`assets/hero-bg.mp4` is an **abstract, slowly-drifting gradient** generated
locally (no footage, no license needed) it sets the mood without needing
any third-party asset. If you want real footage related to soft skills /
teamwork / leadership instead:

1. Download a clip from a genuinely free-to-use source, e.g.:
   - [Pexels Videos](https://www.pexels.com/videos/) search "team meeting", "public speaking", "leadership"
   - [Coverr](https://coverr.co/)
   - [Mixkit](https://mixkit.co/free-stock-video/)
2. Save it as `assets/hero-bg.mp4` (same filename no code changes needed).
3. Note the source and license in `SOURCES_ATTRIBUTION.md` / `.pdf`.

## 5. Step-by-step: from empty folder to a live GitHub Pages site

### Step 1 — Create the GitHub repository
1. On [github.com](https://github.com), click **New repository**.
2. Name it `soft-skills-advisor`, set visibility to **Public**.
3. Don't initialise with a README (you already have one).
4. Click **Create repository**.

### Step 2 — Push your local project
```bash
git init
git add .
git commit -m "Initial commit: Soft Skills Advisor"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/soft-skills-advisor.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Repo → **Settings → Pages**.
2. Source: **Deploy from a branch** → Branch: `main` → Folder: `/ (root)` → **Save**.
3. Wait 1–3 minutes; the live URL appears on that same page once the build finishes.

### Step 4 — Keep it updated
```bash
git add .
git commit -m "Describe your change"
git push
```

### Step 5 — Verify
Open the live URL and test the whole flow: register on the landing page →
confirm you're blocked from `assessment.html` directly without registering →
answer some statements → let the timer run out once (to test the lock) →
check the results page renders correctly → try the email button.

## 6. How each requirement is met

| Requirement | Where |
|---|---|
| Name + email required before starting | `assessment.js` registration gate (redirects to `index.html?required=1`) |
| Inline validation, no popups | `js/validation.js`, used on `index.html` and `contact.html` |
| 20 statements, 5-point Likert scale | `SSA_STATEMENTS` + `SSA_SCALE` in `js/assessment-data.js` |
| 20-minute countdown timer | `startTimer()` in `js/assessment.js` |
| Timeout locks + auto-submits | `handleTimeout()` in `js/assessment.js` |
| Percentage score per value | `computeScores()` in `js/assessment.js` |
| Recommendation when a value < 60% | `ssaGetRecommendation()` in `js/assessment-data.js`, rendered in `js/results.js` |
| Page explaining the four values | `values.html` |
| Canvas radar chart, no libraries | `drawRadarChart()` in `js/results.js` |
| Dark red theme | CSS custom properties (`--red`, `--red-dark`, `--red-light`) in `css/style.css` |
| Hover shadow / color transitions | `.btn-ssa-primary`, `.card-ssa`, `.value-card`, `.result-skill-row`, nav links — all in `css/style.css` |
| Moving background | `.blob-field` (drifting CSS gradients) + `.bg-video` (looping hero clip) in `css/style.css` / `index.html` |
| Email a copy of results | `emailResultsBtn` handler in `js/results.js` (mailto:, see §3 above) |

## 7. Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## 8. Browser support

Tested against current Chrome, Firefox, Edge, and Safari. Uses `<canvas>`,
`<video>`, `sessionStorage`, and CSS custom properties — standard in
evergreen browsers.