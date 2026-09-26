import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Browser-safe persistence for the standalone website.
// The original prototype expected a host-provided storage API;
// a normal Vite website does not provide that API, so use localStorage.
const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  async delete(key) {
    localStorage.removeItem(key);
  },
};

// ---------------------------------------------------------------------------
// Static demo data. Nothing here is generated or randomized, so every run of
// the demo behaves identically — only Trigonometry > Trigonometric Ratios has
// a fully built question set; everything else is an honest stub.
// ---------------------------------------------------------------------------

const DEMO_USER = { email: "akhila@school.edu", password: "demo1234", name: "Akhila", cls: "10", board: "CBSE" };

const IMPROVEMENT_DATA = [
  { quiz: "Quiz 1", Trigonometry: 30, Algebra: 60, Geometry: 50 },
  { quiz: "Quiz 2", Trigonometry: 42, Algebra: 65, Geometry: 58 },
  { quiz: "Quiz 3", Trigonometry: 55, Algebra: 71, Geometry: 60 },
  { quiz: "Quiz 4", Trigonometry: 68, Algebra: 74, Geometry: 63 },
  { quiz: "Quiz 5", Trigonometry: 76, Algebra: 78, Geometry: 65 },
];

const QUIZ_HISTORY = [
  { date: "19 Aug 2026", chapter: "Trigonometry", topic: "Diagnostic (baseline)", score: 3, max: 6, status: "Baseline" },
  { date: "26 Aug 2026", chapter: "Geometry", topic: "Triangles", score: 7, max: 10, status: "Passed" },
  { date: "02 Sep 2026", chapter: "Algebra", topic: "Linear Equations", score: 9, max: 10, status: "Passed" },
  { date: "09 Sep 2026", chapter: "Trigonometry", topic: "Trigonometric Ratios", score: 15, max: 22, status: "Needs review" },
];

const INITIAL_NOTES = [
  { id: "seed-1", name: "Trigonometry_Chapter8_Notes.pdf", date: "3 days ago", size: "1.2 MB" },
  { id: "seed-2", name: "Algebra_Formula_Sheet.docx", date: "1 week ago", size: "340 KB" },
];

const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
const SUBJECTS = ["Mathematics", "Science", "English", "Social Science", "Hindi", "Computer Applications"];

const CHAPTERS = [
  { id: "number-systems", name: "Number Systems", mastery: 58 },
  { id: "algebra", name: "Algebra", mastery: 71 },
  { id: "trigonometry", name: "Trigonometry", mastery: 42 },
  { id: "geometry", name: "Geometry", mastery: 65 },
  { id: "mensuration", name: "Mensuration", mastery: 30 },
  { id: "coordinate-geometry", name: "Coordinate Geometry", mastery: 0 },
  { id: "statistics-probability", name: "Statistics & Probability", mastery: 0 },
];

const CHAPTER_PATHS = {
  trigonometry: [
    { id: "t0", name: "Trigonometric Ratios", built: true, mastery: 42 },
    { id: "t1", name: "Trigonometric Identities", built: false, mastery: 65 },
    { id: "t2", name: "Heights & Distances", built: false, mastery: 30 },
    { id: "t3", name: "Trigonometric Equations", built: false, mastery: 78 },
    { id: "t4", name: "Applications & Word Problems", built: false, mastery: 15 },
  ],
  algebra: [
    { id: "a0", name: "Linear Equations", built: false, mastery: 75 },
    { id: "a1", name: "Quadratic Equations", built: false, mastery: 55 },
    { id: "a2", name: "Arithmetic Progressions", built: false, mastery: 40 },
    { id: "a3", name: "Polynomials", built: false, mastery: 68 },
  ],
  geometry: [
    { id: "g0", name: "Triangles", built: false, mastery: 60 },
    { id: "g1", name: "Circles", built: false, mastery: 35 },
    { id: "g2", name: "Polygons", built: false, mastery: 80 },
    { id: "g3", name: "Constructions", built: false, mastery: 50 },
  ],
  "number-systems": [
    { id: "n0", name: "Real Numbers", built: false, mastery: 70 },
    { id: "n1", name: "Rational & Irrational Numbers", built: false, mastery: 45 },
    { id: "n2", name: "Laws of Exponents", built: false, mastery: 58 },
  ],
  mensuration: [
    { id: "m0", name: "Surface Areas & Volumes", built: false, mastery: 25 },
    { id: "m1", name: "Area of Combined Shapes", built: false, mastery: 60 },
  ],
  "coordinate-geometry": [
    { id: "c0", name: "Distance Formula", built: false, mastery: 0 },
    { id: "c1", name: "Section Formula", built: false, mastery: 0 },
  ],
  "statistics-probability": [
    { id: "s0", name: "Mean, Median, Mode", built: false, mastery: 0 },
    { id: "s1", name: "Probability Basics", built: false, mastery: 0 },
  ],
};

const FORMULA_SHEET = {
  "number-systems": ["√(ab) = √a × √b", "aᵐ × aⁿ = aᵐ⁺ⁿ", "(aᵐ)ⁿ = aᵐⁿ"],
  algebra: ["Quadratic formula: x = [−b ± √(b² − 4ac)] / 2a", "nth term of AP: aₙ = a + (n−1)d", "Sum of n terms of AP: Sₙ = n/2 [2a + (n−1)d]"],
  trigonometry: ["sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "1 + cot²θ = cosec²θ", "tan θ = sin θ / cos θ"],
  geometry: ["Sum of angles in a triangle = 180°", "Pythagoras: a² + b² = c²", "Sum of interior angles of an n-gon = (n − 2) × 180°"],
  mensuration: ["Area of circle = πr²", "Curved surface area of cylinder = 2πrh", "Volume of cone = 1/3 πr²h", "Surface area of sphere = 4πr²"],
  "coordinate-geometry": ["Distance formula: d = √[(x₂−x₁)² + (y₂−y₁)²]", "Midpoint: ((x₁+x₂)/2, (y₁+y₂)/2)", "Slope = (y₂−y₁) / (x₂−x₁)"],
  "statistics-probability": ["Mean = Σx / n", "Probability = favourable outcomes / total outcomes", "Median (even n) = average of the two middle terms"],
};

// Trigonometric Ratios — the one fully built node
const CHAPTER_LABEL = "Trigonometry";
const TOPIC_LABEL = "Trigonometric Ratios";

const MCQ = [
  { id: "mcq1", marks: 1, q: "sin(30°) = ?", options: ["1/2", "√3/2", "1", "0"], correct: "1/2" },
  { id: "mcq2", marks: 1, q: "cos(60°) = ?", options: ["1", "1/2", "√3/2", "0"], correct: "1/2" },
  { id: "mcq3", marks: 1, q: "tan(45°) = ?", options: ["0", "1", "√3", "1/√3"], correct: "1" },
  { id: "mcq4", marks: 1, q: "sin²θ + cos²θ = ?", options: ["0", "1", "2", "θ"], correct: "1" },
  { id: "mcq5", marks: 1, q: "cosec(θ) is the reciprocal of:", options: ["cos(θ)", "tan(θ)", "sin(θ)", "sec(θ)"], correct: "sin(θ)" },
];

const MCQ_SIMILAR = {
  mcq1: { q: "sin(0°) = ?", options: ["0", "1", "1/2", "Undefined"], correct: "0" },
  mcq2: { q: "cos(90°) = ?", options: ["1", "0", "1/2", "Undefined"], correct: "0" },
  mcq3: { q: "cot(45°) = ?", options: ["0", "1", "√3", "Undefined"], correct: "1" },
  mcq4: { q: "1 + tan²θ = ?", options: ["sec²θ", "cosec²θ", "1", "tan²θ"], correct: "sec²θ" },
  mcq5: { q: "sec(θ) is the reciprocal of:", options: ["sin(θ)", "tan(θ)", "cos(θ)", "cosec(θ)"], correct: "cos(θ)" },
};

const MCQ_FEEDBACK = {
  mcq1: { hint: "Think of the sine graph at its starting point.", explain: "sin(θ) starts at 0 when θ = 0° and rises to 1 at 90°." },
  mcq2: { hint: "cos(θ) is at its peak when θ = 0°.", explain: "cos(0°) = 1, and cos(θ) decreases to 0 as θ approaches 90°." },
  mcq3: { hint: "cot is the reciprocal of tan.", explain: "tan(45°) = 1, so cot(45°) = 1/tan(45°) = 1 as well." },
  mcq4: { hint: "Divide the identity sin²θ + cos²θ = 1 by cos²θ.", explain: "Dividing sin²θ + cos²θ = 1 by cos²θ gives tan²θ + 1 = sec²θ." },
  mcq5: { hint: "sec is built from cos, the way cosec is built from sin.", explain: "sec(θ) = 1/cos(θ), the same pattern as cosec(θ) = 1/sin(θ)." },
};

const TWO_MARK = [
  { id: "tm1", marks: 2, q: "Prove that tan(θ) = sin(θ) / cos(θ).",
    modelAnswer: "sin(θ)/cos(θ) = (opposite/hypotenuse) ÷ (adjacent/hypotenuse) = opposite/adjacent = tan(θ)." },
  { id: "tm2", marks: 2, q: "If sin(θ) = 3/5, find cos(θ) using the Pythagorean identity.",
    modelAnswer: "sin²θ + cos²θ = 1 → cos²θ = 1 − 9/25 = 16/25 → cos(θ) = 4/5." },
  { id: "tm3", marks: 2, q: "Find the value of sin(45°) + cos(45°).",
    modelAnswer: "sin(45°) = cos(45°) = 1/√2. Sum = 2/√2 = √2 ≈ 1.414." },
];

const THREE_MARK = [
  { id: "thm1", marks: 3, q: "Prove that 1 − cos²θ = sin²θ, and use it to find sin(θ) if cos(θ) = 4/5.",
    modelAnswer: "1 − cos²θ = sin²θ is the Pythagorean identity rearranged. With cos(θ) = 4/5: sin²θ = 1 − 16/25 = 9/25, so sin(θ) = 3/5." },
  { id: "thm2", marks: 3, q: "A ladder leans against a wall making a 60° angle with the ground. If the foot of the ladder is 2 m from the wall, find the length of the ladder.",
    modelAnswer: "cos(60°) = adjacent/hypotenuse = 2/L → 1/2 = 2/L → L = 4 m." },
];

const FIVE_MARK = [
  { id: "fm1", marks: 5, q: "From the top of a 20 m tall building, the angle of depression to a car on the ground is 30°. Find the distance of the car from the base of the building. Show all steps with proper trigonometric reasoning.",
    modelAnswer: "Angle of depression equals angle of elevation (alternate angles) = 30°. tan(30°) = height/distance → distance = height / tan(30°) = 20 / (1/√3) = 20√3 ≈ 34.6 m." },
];

const SUBJECTIVE_QUESTIONS = [...TWO_MARK, ...THREE_MARK, ...FIVE_MARK];
const MAX_MARKS = MCQ.reduce((s, q) => s + q.marks, 0) + SUBJECTIVE_QUESTIONS.reduce((s, q) => s + q.marks, 0);

// ---------------------------------------------------------------------------
// Real AI grading for typed / uploaded subjective answers — actually checks
// content against the expected reasoning instead of rewarding "something was
// submitted."
// ---------------------------------------------------------------------------

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: String(reader.result).split(",")[1], mediaType: file.type || "image/png" });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildGradingPrompt(q, answerLine) {
  return `You are grading a Class 10 CBSE Trigonometry answer. Be strict and honest.
Question (worth ${q.marks} mark${q.marks > 1 ? "s" : ""}): ${q.q}
Expected reasoning / model answer: ${q.modelAnswer}
${answerLine}
Award 0 marks if the answer is blank, irrelevant, random characters, or shows no genuine mathematical attempt — do not give credit just for something being present. Award partial marks only for partially correct working. Respond with ONLY raw JSON, no markdown fences, no other text: {"marks": <integer from 0 to ${q.marks}>, "feedback": "<one short sentence, under 15 words>"}`;
}

async function gradeSubjective(q, val) {
  if (!val) return { awarded: 0, feedback: "Not answered.", status: "Not answered" };

  let content;
  if (val.mode === "text") {
    const text = (val.text || "").trim();
    if (!text) return { awarded: 0, feedback: "Not answered.", status: "Not answered" };
    content = buildGradingPrompt(q, `Student's typed answer: "${text}"`);
  } else if (val.mode === "image" && val.file) {
    try {
      const { base64, mediaType } = await fileToBase64(val.file);
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: buildGradingPrompt(q, "The student's handwritten answer is shown in the image above.") },
            ],
          }],
        }),
      });
      const data = await resp.json();
      const raw = (data.content || []).map((b) => b.text || "").join("").trim();
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const awarded = Math.max(0, Math.min(q.marks, Math.round(parsed.marks)));
      return { awarded, feedback: parsed.feedback || "", status: "AI evaluated (from photo)" };
    } catch (err) {
      return { awarded: 0, feedback: "Couldn't evaluate this photo — review manually.", status: "Evaluation failed" };
    }
  } else {
    return { awarded: 0, feedback: "Not answered.", status: "Not answered" };
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
    });
    const data = await resp.json();
    const raw = (data.content || []).map((b) => b.text || "").join("").trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const awarded = Math.max(0, Math.min(q.marks, Math.round(parsed.marks)));
    return { awarded, feedback: parsed.feedback || "", status: "AI evaluated" };
  } catch (err) {
    return { awarded: 0, feedback: "Couldn't evaluate this answer — review manually.", status: "Evaluation failed" };
  }
}

function buildMcqPracticeSet(wrongMcqs) {
  const set = [];
  wrongMcqs.forEach((origQ) => {
    set.push({ id: `redo-${origQ.id}`, kind: "redo", q: origQ.q, options: origQ.options, correct: origQ.correct, ...MCQ_FEEDBACK[origQ.id] });
    const sim = MCQ_SIMILAR[origQ.id];
    set.push({ id: `sim-${origQ.id}`, kind: "similar", q: sim.q, options: sim.options, correct: sim.correct, ...MCQ_FEEDBACK[origQ.id] });
  });
  return set;
}

function readFileForNote(file) {
  return new Promise((resolve) => {
    if (file.size > 4 * 1024 * 1024) { resolve({ contentKind: "too-large" }); return; }

    const isText = file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");

    if (isText) {
      const reader = new FileReader();
      reader.onload = () => resolve({ contentKind: "text", text: String(reader.result).slice(0, 8000) });
      reader.onerror = () => resolve({ contentKind: "unsupported" });
      reader.readAsText(file);
    } else if (isPdf || isImage) {
      const reader = new FileReader();
      reader.onload = () => resolve({ contentKind: isPdf ? "pdf" : "image", base64: String(reader.result).split(",")[1], mediaType: file.type });
      reader.onerror = () => resolve({ contentKind: "unsupported" });
      reader.readAsDataURL(file);
    } else {
      resolve({ contentKind: "unsupported" });
    }
  });
}

const GEN_PROMPTS = {
  notes: "Summarize the key concepts in this study material into clear, well-organized study notes for a Class 10 CBSE student. Use short headings and bullet points. Keep it under 300 words. Respond with plain text only — no markdown code fences, no preamble.",
  formula: `Extract every formula, definition, or key fact from this study material relevant to a Class 10 CBSE student. Respond with ONLY a raw JSON array of strings, no markdown fences, no other text, at most 10 items. Example: ["formula or fact 1", "formula or fact 2"]`,
  quiz: `Create exactly 5 multiple-choice questions testing understanding of this study material, appropriate for a Class 10 CBSE student. Respond with ONLY raw JSON, no markdown fences, no other text, in this exact shape: [{"q":"...","options":["...","...","...","..."],"correct":"..."}]. The "correct" value must exactly match one of the strings in "options".`,
};

async function generateFromNote(note, kind) {
  if (!note || !note.contentKind || note.contentKind === "unsupported") return { status: "unsupported" };
  if (note.contentKind === "too-large") return { status: "too-large" };

  const instruction = GEN_PROMPTS[kind];
  let content;
  if (note.contentKind === "text") {
    content = `${instruction}\n\nStudy material:\n"""\n${note.text}\n"""`;
  } else {
    const blockType = note.contentKind === "pdf" ? "document" : "image";
    content = [
      { type: blockType, source: { type: "base64", media_type: note.mediaType, data: note.base64 } },
      { type: "text", text: instruction },
    ];
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
    });
    const data = await resp.json();
    const raw = (data.content || []).map((b) => b.text || "").join("").trim();
    if (kind === "notes") return { status: "done", data: raw };
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return { status: "done", data: parsed };
  } catch (err) {
    return { status: "error" };
  }
}

function masteryColor(v) {
  if (v === 0) return "#C9C2B2";
  if (v >= 70) return "#3E7C59";
  if (v >= 45) return "#C77D2E";
  return "#B4472A";
}

function statusLabel(m) {
  if (m === 0) return "Not started";
  if (m < 45) return "Weak";
  if (m < 70) return "Moderate";
  return "Strong";
}

function estimateHours(m) {
  if (m === 0) return 3;
  if (m < 45) return 4;
  if (m < 70) return 2;
  return 0.5;
}

function getTopicMastery(topicScores, chapterId, nodeId, fallback) {
  const v = topicScores?.[chapterId]?.[nodeId];
  return typeof v === "number" ? v : fallback;
}

function ProgressRing({ percent, size = 64, label }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const color = masteryColor(percent);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#EDE9DE" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
        <text
          x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          style={{ fontSize: size * 0.24, fontWeight: 700, fill: "#1E2A4A", fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          {percent}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 11.5, color: "#6B6558", fontWeight: 500 }}>{label}</span>}
    </div>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getLastNDays(n) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ dateKey: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-US", { weekday: "short" }) });
  }
  return days;
}

const SEED_HOURS = [1.2, 0.8, 1.6, 2.1, 0.4, 1.9]; // last 6 days before today — today starts at 0 and tracks live

function buildSeedTimeMap() {
  const days = getLastNDays(7);
  const map = {};
  days.forEach((d, i) => { map[d.dateKey] = i < 6 ? SEED_HOURS[i] : 0; });
  return map;
}

async function generateDppQuestions(chapterName, topicName) {
  const instruction = `Create exactly 10 multiple-choice questions on the topic "${topicName}" from the chapter "${chapterName}", suitable for a Class 10 CBSE Mathematics student doing daily practice. Vary difficulty from easy to moderately challenging. Respond with ONLY raw JSON, no markdown fences, no other text, in this exact shape: [{"q":"...","options":["...","...","...","..."],"correct":"..."}] with exactly 10 items. The "correct" value must exactly match one of the strings in "options".`;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: instruction }] }),
    });
    const data = await resp.json();
    const raw = (data.content || []).map((b) => b.text || "").join("").trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return { status: "done", data: parsed };
  } catch (err) {
    return { status: "error" };
  }
}

// ---------------------------------------------------------------------------
// App shell — auth, then dashboard
// ---------------------------------------------------------------------------

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("explore");
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [completedNodes, setCompletedNodes] = useState({});
  const [completedLoaded, setCompletedLoaded] = useState(false);
  const [topicScores, setTopicScores] = useState({});
  const [topicScoresLoaded, setTopicScoresLoaded] = useState(false);
  const [timeSpentMap, setTimeSpentMap] = useState({});
  const [timeLoaded, setTimeLoaded] = useState(false);

  // Load any notes saved in a previous session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await storage.get("cerevia-notes");
        if (!cancelled && result && result.value) {
          setNotes(JSON.parse(result.value));
        }
      } catch (err) {
        // Nothing saved yet — keep the starter notes.
      } finally {
        if (!cancelled) setNotesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist notes after the initial load so we never overwrite saved data
  // with the starter defaults before the load finishes.
  useEffect(() => {
    if (!notesLoaded) return;
    storage.set("cerevia-notes", JSON.stringify(notes)).catch(() => {});
  }, [notes, notesLoaded]);

  // Load / persist which topics have been completed in Explore, so DPP
  // and progress across the app can see it, not just the Explore tab.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await storage.get("cerevia-completed");
        if (!cancelled && result && result.value) {
          setCompletedNodes(JSON.parse(result.value));
        }
      } catch (err) {
        // Nothing completed yet.
      } finally {
        if (!cancelled) setCompletedLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!completedLoaded) return;
    storage.set("cerevia-completed", JSON.stringify(completedNodes)).catch(() => {});
  }, [completedNodes, completedLoaded]);

  // Load / persist real per-topic mastery scores recorded from actual quiz
  // attempts (overrides the static mock defaults once a topic is attempted).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await storage.get("cerevia-topic-scores");
        if (!cancelled && result && result.value) {
          setTopicScores(JSON.parse(result.value));
        }
      } catch (err) {
        // Nothing recorded yet.
      } finally {
        if (!cancelled) setTopicScoresLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!topicScoresLoaded) return;
    storage.set("cerevia-topic-scores", JSON.stringify(topicScores)).catch(() => {});
  }, [topicScores, topicScoresLoaded]);

  // Load / persist hours spent in the app, seeding a plausible week if this
  // is the first time so the Progress chart isn't empty on first login.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await storage.get("cerevia-time-spent");
        if (!cancelled && result && result.value) {
          setTimeSpentMap(JSON.parse(result.value));
        } else if (!cancelled) {
          setTimeSpentMap(buildSeedTimeMap());
        }
      } catch (err) {
        setTimeSpentMap(buildSeedTimeMap());
      } finally {
        if (!cancelled) setTimeLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!timeLoaded) return;
    storage.set("cerevia-time-spent", JSON.stringify(timeSpentMap)).catch(() => {});
  }, [timeSpentMap, timeLoaded]);

  // Track real time spent in the app today, only while the tab is visible.
  useEffect(() => {
    if (!currentUser || !timeLoaded) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      setTimeSpentMap((prev) => {
        const key = todayKey();
        const current = prev[key] || 0;
        return { ...prev, [key]: +(current + 15 / 3600).toFixed(4) };
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser, timeLoaded]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const contentInfo = await readFileForNote(file);
    const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotes((prev) => [{ id, name: file.name, date: "Just now", size: `${Math.max(1, Math.round(file.size / 1024))} KB`, ...contentInfo }, ...prev]);
  };

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        button { font-family: 'IBM Plex Sans', sans-serif; cursor: pointer; }
        input, select, textarea { font-family: 'IBM Plex Sans', sans-serif; }
        .nav-btn:hover { background: rgba(246,243,237,0.08) !important; }
        .file-label:hover { border-color: #1E2A4A !important; }
        .tab-btn:hover { color: #1E2A4A !important; }
        .opt-btn:hover { border-color: #1E2A4A !important; }
        .opt-btn:disabled { cursor: default; }
        .node-btn:not(:disabled):hover { transform: translateY(-2px); }
      `}</style>

      {!currentUser ? (
        <AuthScreen onAuthed={setCurrentUser} />
      ) : (
        <Dashboard
          user={currentUser}
          page={page} setPage={setPage}
          onLogout={() => { setCurrentUser(null); setPage("explore"); }}
          notes={notes} onUpload={handleUpload}
          completedNodes={completedNodes} setCompletedNodes={setCompletedNodes}
          topicScores={topicScores} setTopicScores={setTopicScores}
          timeSpentMap={timeSpentMap}
        />
      )}
    </div>
  );
}

function AuthScreen({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [loginEmail, setLoginEmail] = useState(DEMO_USER.email);
  const [loginPassword, setLoginPassword] = useState(DEMO_USER.password);
  const [loginError, setLoginError] = useState("");

  const [name, setName] = useState("");
  const [cls, setCls] = useState("10");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");

  const handleLogin = () => {
    if (loginEmail.trim().toLowerCase() === DEMO_USER.email && loginPassword.trim() === DEMO_USER.password) {
      setLoginError("");
      onAuthed({ name: DEMO_USER.name, cls: DEMO_USER.cls, board: DEMO_USER.board });
    } else {
      setLoginError("Invalid email or password.");
    }
  };

  const handleSignup = () => {
    if (!name.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError("Fill in every field to continue.");
      return;
    }
    setSignupError("");
    onAuthed({ name: name.trim(), cls, board: "CBSE" });
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginPanel}>
        <div style={styles.loginBrand}>
          <p style={styles.brandLogo}>CEREVIA</p>
          <p style={styles.brandBody}>From learning gaps to learning growth.</p>
        </div>

        <div style={styles.loginFormSide}>
          <div style={styles.tabRow}>
            <button type="button" className="tab-btn" style={{ ...styles.tabBtn, ...(tab === "login" ? styles.tabBtnActive : {}) }} onClick={() => setTab("login")}>Log in</button>
            <button type="button" className="tab-btn" style={{ ...styles.tabBtn, ...(tab === "signup" ? styles.tabBtnActive : {}) }} onClick={() => setTab("signup")}>Sign up</button>
          </div>

          {tab === "login" ? (
            <div>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input} type="email" value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
              <label style={styles.label}>Password</label>
              <input
                style={styles.input} type="password" value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
              {loginError && <p style={styles.errorText}>{loginError}</p>}
              <button type="button" style={styles.primaryBtn} onClick={handleLogin}>Log in</button>
              <p style={styles.demoHint}>Pre-filled with a working demo account.</p>
            </div>
          ) : (
            <div>
              <label style={styles.label}>Name</label>
              <input style={styles.input} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <label style={styles.label}>Class</label>
              <select style={styles.input} value={cls} onChange={(e) => setCls(e.target.value)}>
                {GRADES.map((g) => <option key={g} value={g}>Class {g}</option>)}
              </select>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="you@school.edu" />
              <label style={styles.label}>Password</label>
              <input
                style={styles.input} type="password" value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSignup(); }}
                placeholder="••••••••"
              />
              {signupError && <p style={styles.errorText}>{signupError}</p>}
              <button type="button" style={styles.primaryBtn} onClick={handleSignup}>Create account</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, page, setPage, onLogout, notes, onUpload, completedNodes, setCompletedNodes, topicScores, setTopicScores, timeSpentMap }) {
  const navItems = [
    { id: "explore", label: "Explore" },
    { id: "dpp", label: "DPP" },
    { id: "assignments", label: "Assignments" },
    { id: "overview", label: "Improvement" },
    { id: "path", label: "Personalized Path" },
    { id: "progress", label: "Progress" },
    { id: "quizzes", label: "Quiz Marks" },
    { id: "notes", label: "Uploaded Notes" },
  ];

  return (
    <div style={styles.dashWrap}>
      <aside style={styles.sidebar}>
        <button style={styles.sidebarLogoBtn} onClick={() => setPage("explore")} title="Back to dashboard">CEREVIA</button>
        <div style={styles.userBlock}>
          <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.userName}>{user.name}</p>
            <p style={styles.userMeta}>Class {user.cls} · {user.board}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className="nav-btn"
              style={{ ...styles.navBtn, background: page === item.id ? "rgba(246,243,237,0.12)" : "transparent" }}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={onLogout}>Log out</button>
      </aside>

      <main style={styles.main}>
        {page === "explore" && <ExplorePage notes={notes} onUpload={onUpload} completedNodes={completedNodes} setCompletedNodes={setCompletedNodes} setTopicScores={setTopicScores} />}
        {page === "dpp" && <DppPage completedNodes={completedNodes} />}
        {page === "assignments" && <AssignmentsPage />}
        {page === "overview" && <OverviewPage topicScores={topicScores} />}
        {page === "path" && <PersonalizedPathPage topicScores={topicScores} setPage={setPage} />}
        {page === "progress" && <ProgressPage timeSpentMap={timeSpentMap} />}
        {page === "quizzes" && <QuizzesPage />}
        {page === "notes" && <NotesPage notes={notes} onUpload={onUpload} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explore: Grade -> Subject -> Chapter grid -> Flowchart path -> Node quiz
// (MCQ diagnostic -> adaptive practice on misses -> reassessment -> written
// questions with real AI grading)
// ---------------------------------------------------------------------------

function ExplorePage({ notes, onUpload, completedNodes, setCompletedNodes, setTopicScores }) {
  const [view, setView] = useState("grade");
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [nodeIndex, setNodeIndex] = useState(null);

  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [reveal, setReveal] = useState(null);
  const [subjIndex, setSubjIndex] = useState(0);
  const [subjAnswers, setSubjAnswers] = useState({});

  const wrongMcqs = MCQ.filter((q) => mcqAnswers[q.id]?.selected !== q.correct);
  const mcqScoreBefore = MCQ.filter((q) => mcqAnswers[q.id]?.correct).length;
  const practiceSet = useMemo(() => buildMcqPracticeSet(wrongMcqs), [JSON.stringify(mcqAnswers)]);
  const practiceCorrect = practiceSet.filter((q) => practiceAnswers[q.id]?.correct).length;
  const mcqScoreAfter = practiceSet.length > 0 ? Math.round((practiceCorrect / practiceSet.length) * MCQ.length) : mcqScoreBefore;

  const resetQuizState = () => {
    setMcqIndex(0); setMcqAnswers({});
    setPracticeIndex(0); setPracticeAnswers({}); setReveal(null);
    setSubjIndex(0); setSubjAnswers({});
  };

  const openNode = (idx) => {
    const node = CHAPTER_PATHS[chapterId][idx];
    if (!node.built) return;
    setNodeIndex(idx);
    resetQuizState();
    setView("mcq");
  };

  const finishNode = () => {
    const nodeId = CHAPTER_PATHS[chapterId][nodeIndex].id;
    setCompletedNodes((prev) => {
      const arr = prev[chapterId] ? [...prev[chapterId]] : [];
      arr[nodeIndex] = true;
      return { ...prev, [chapterId]: arr };
    });
    const percent = Math.round((mcqScoreBefore / MCQ.length) * 100);
    setTopicScores((prev) => ({ ...prev, [chapterId]: { ...(prev[chapterId] || {}), [nodeId]: percent } }));
    setView("path");
  };

  return (
    <div>
      {view === "grade" && <GradeScreen onSelect={(g) => { setGrade(g); setView("subject"); }} />}
      {view === "subject" && (
        <SubjectScreen grade={grade} onSelect={(s) => { setSubject(s); if (s === "Mathematics") setView("grid"); }} onBack={() => setView("grade")} />
      )}
      {view === "grid" && <ChapterGrid grade={grade} notes={notes} onUpload={onUpload} onOpen={(id) => { setChapterId(id); setView("path"); }} onBack={() => setView("subject")} />}
      {view === "path" && (
        <ChapterPath chapterId={chapterId} completed={completedNodes[chapterId] || []} onOpenNode={openNode} onBack={() => setView("grid")} />
      )}

      {view === "mcq" && (
        <McqScreen
          index={mcqIndex}
          onAnswer={(q, opt) => {
            const updated = { ...mcqAnswers, [q.id]: { selected: opt, correct: opt === q.correct } };
            setMcqAnswers(updated);
            setTimeout(() => {
              if (mcqIndex < MCQ.length - 1) {
                setMcqIndex(mcqIndex + 1);
              } else {
                const hasWrong = MCQ.some((m) => updated[m.id]?.correct !== true);
                setView(hasWrong ? "adaptive" : "subjective");
              }
            }, 300);
          }}
        />
      )}
      {view === "adaptive" && (
        <AdaptiveScreen wrongCount={wrongMcqs.length} onStart={() => setView("practice")} />
      )}
      {view === "practice" && (
        <PracticeScreen
          practiceSet={practiceSet}
          index={practiceIndex}
          answers={practiceAnswers}
          reveal={reveal}
          setReveal={setReveal}
          onAnswer={(q, opt) => {
            setPracticeAnswers((prev) => ({ ...prev, [q.id]: { selected: opt, correct: opt === q.correct } }));
            setReveal(null);
          }}
          onNext={() => {
            setReveal(null);
            if (practiceIndex < practiceSet.length - 1) setPracticeIndex(practiceIndex + 1);
            else setView("reassess");
          }}
        />
      )}
      {view === "reassess" && (
        <ReassessScreen before={mcqScoreBefore} after={mcqScoreAfter} onContinue={() => setView("subjective")} />
      )}

      {view === "subjective" && (
        <SubjectiveRunner
          index={subjIndex}
          answers={subjAnswers}
          setAnswers={setSubjAnswers}
          onNext={() => {
            if (subjIndex < SUBJECTIVE_QUESTIONS.length - 1) setSubjIndex(subjIndex + 1);
            else setView("results");
          }}
          onExit={() => setView("path")}
        />
      )}
      {view === "results" && (
        <ResultsScreen
          mcqBefore={mcqScoreBefore}
          mcqAfter={wrongMcqs.length > 0 ? mcqScoreAfter : null}
          subjAnswers={subjAnswers}
          onContinue={finishNode}
        />
      )}
    </div>
  );
}

function GradeScreen({ onSelect }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.simpleH1}>Which class are you in?</h1>
      <div style={styles.plainBtnRow}>
        {GRADES.map((g) => <button key={g} style={styles.plainBtn} onClick={() => onSelect(g)}>Class {g}</button>)}
      </div>
    </div>
  );
}

function SubjectScreen({ grade, onSelect, onBack }) {
  const [stub, setStub] = useState(null);
  return (
    <div style={styles.wrap}>
      <button style={styles.backLink} onClick={onBack}>← Change class</button>
      <h1 style={styles.simpleH1}>Class {grade} — pick a subject</h1>
      <div style={styles.plainBtnRow}>
        {SUBJECTS.map((s) => (
          <button key={s} style={styles.plainBtn} onClick={() => { if (s !== "Mathematics") setStub(s); onSelect(s); }}>{s}</button>
        ))}
      </div>
      {stub && <p style={styles.stubLine}>{stub} content isn't built yet — try Mathematics for the working demo.</p>}
    </div>
  );
}

function ChapterGrid({ grade, notes, onUpload, onOpen, onBack }) {
  const [showFormulas, setShowFormulas] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div style={styles.wrap}>
      <button style={styles.backLink} onClick={onBack}>← Change subject</button>
      <p style={styles.eyebrow}>Mathematics · Class {grade} · CBSE</p>
      <h1 style={styles.h1}>Pick a chapter to enter.</h1>

      <div style={styles.btnPairRow}>
        <label style={styles.uploadBtn}>
          Upload your own study material
          <input type="file" style={{ display: "none" }} onChange={(e) => { onUpload(e); setShowNotes(true); }} />
        </label>
        <button style={styles.uploadBtn} onClick={() => setShowFormulas((v) => !v)}>
          {showFormulas ? "Hide formula sheet" : "Formula sheet"}
        </button>
        <button style={styles.uploadBtn} onClick={() => setShowNotes((v) => !v)}>
          {showNotes ? "Hide my notes" : `My uploaded notes (${notes.length})`}
        </button>
      </div>

      {showNotes && (
        <div style={styles.tableCard}>
          {notes.length === 0 ? (
            <p style={{ ...styles.stubLine, padding: 16, margin: 0 }}>Nothing uploaded yet.</p>
          ) : (
            notes.map((n, i) => (
              <div key={i} style={styles.tableRow}>
                <span style={{ ...styles.td, flex: 2.4 }}>{n.name}</span>
                <span style={{ ...styles.td, flex: 1, color: "#8B8474" }}>{n.size}</span>
                <span style={{ ...styles.td, flex: 1, textAlign: "right", color: "#8B8474" }}>{n.date}</span>
              </div>
            ))
          )}
        </div>
      )}
      {showNotes && <p style={styles.stubLine}>Also visible in "Uploaded Notes" on the sidebar — same list, either place you add from.</p>}

      {showFormulas && (
        <div style={styles.formulaGrid}>
          {CHAPTERS.map((c) => (
            <div key={c.id} style={styles.formulaCard}>
              <p style={styles.formulaChapterName}>{c.name}</p>
              <ul style={styles.formulaList}>
                {FORMULA_SHEET[c.id].map((f, i) => <li key={i} style={styles.formulaItem}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...styles.grid, marginTop: 20 }}>
        {CHAPTERS.map((c) => (
          <button key={c.id} className="node-btn" style={styles.chapterCard} onClick={() => onOpen(c.id)}>
            <p style={styles.chapterName}>{c.name}</p>
            <div style={styles.chapterBarTrack}><div style={{ ...styles.chapterBarFill, width: `${c.mastery}%`, background: masteryColor(c.mastery) }} /></div>
            <p style={styles.chapterPct}>{c.mastery}% mastered</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChapterPath({ chapterId, completed, onOpenNode, onBack }) {
  const nodes = CHAPTER_PATHS[chapterId];
  const chapterName = CHAPTERS.find((c) => c.id === chapterId)?.name;
  const [stubMsg, setStubMsg] = useState(false);

  const stateFor = (i) => {
    if (completed[i]) return "done";
    const firstIncomplete = nodes.findIndex((n, idx) => !completed[idx]);
    if (i === firstIncomplete) return "current";
    return "locked";
  };

  return (
    <div style={styles.wrap}>
      <button style={styles.backLink} onClick={onBack}>← All chapters</button>
      <p style={styles.eyebrow}>{chapterName}</p>
      <h1 style={styles.h1}>Your path through this chapter.</h1>
      <p style={styles.pathHint}>Each topic unlocks once you complete the one above it.</p>

      <div style={styles.flow}>
        {nodes.map((node, i) => {
          const state = stateFor(i);
          const statusLabel = state === "done" ? "Completed" : state === "current" ? "Start here" : "Locked";
          return (
            <div key={node.id} style={styles.flowItem}>
              <button
                className="node-btn"
                disabled={state === "locked"}
                style={{ ...styles.flowBox, borderColor: state === "done" ? "#3E7C59" : state === "current" ? "#C77D2E" : "#DAD4C4", background: state === "locked" ? "#EDE9DE" : "#fff" }}
                onClick={() => { if (!node.built) { setStubMsg(node.name); return; } onOpenNode(i); }}
                title={state === "locked" ? "Complete the topic above to unlock this" : undefined}
              >
                <span style={{ ...styles.flowBadge, background: state === "done" ? "#3E7C59" : state === "current" ? "#1E2A4A" : "#C9C2B2" }}>
                  {state === "done" ? "✓" : state === "locked" ? "🔒" : i + 1}
                </span>
                <span style={styles.flowBoxText}>
                  <span style={{ ...styles.flowBoxName, color: state === "locked" ? "#9A9280" : "#1E2A4A" }}>{node.name}</span>
                  <span style={{ ...styles.flowBoxStatus, color: state === "done" ? "#3E7C59" : state === "current" ? "#C77D2E" : "#9A9280" }}>{statusLabel}</span>
                </span>
              </button>
              {i < nodes.length - 1 && (
                <div style={styles.flowConnector}>
                  <div style={{ ...styles.flowLine, background: state === "done" ? "#3E7C59" : "#DAD4C4" }} />
                  <div style={{ ...styles.flowArrow, borderTopColor: state === "done" ? "#3E7C59" : "#DAD4C4" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {stubMsg && (
        <div style={styles.calloutBox}>
          <p style={styles.calloutLabel}>Coming soon</p>
          <p style={styles.calloutText}>The full question bank for "{stubMsg}" isn't built yet. Try Trigonometric Ratios for the complete working demo.</p>
        </div>
      )}
    </div>
  );
}

function Panel({ children, width }) {
  return <div style={{ ...styles.panel, maxWidth: width || 560, margin: "0 auto" }}>{children}</div>;
}

function QuestionTag({ extra }) {
  return <p style={styles.stepTag}>{TOPIC_LABEL} · {CHAPTER_LABEL}{extra ? ` · ${extra}` : ""}</p>;
}

function McqScreen({ index, onAnswer }) {
  const q = MCQ[index];
  return (
    <div style={styles.wrap}>
      <Panel width={620}>
        <QuestionTag extra={`Diagnostic · Question ${index + 1} of ${MCQ.length}`} />
        <h2 style={styles.h2}>{q.q}</h2>
        <div style={styles.optionGrid}>
          {q.options.map((opt) => (
            <button key={opt} className="opt-btn" style={styles.optBtn} onClick={() => onAnswer(q, opt)}>{opt}</button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AdaptiveScreen({ wrongCount, onStart }) {
  return (
    <div style={styles.wrap}>
      <Panel>
        <p style={styles.stepTag}>Recommended for you</p>
        <h2 style={styles.h2}>Let's revisit {wrongCount} question{wrongCount > 1 ? "s" : ""} first.</h2>
        <p style={styles.body}>
          Before moving on to the written questions, we're bringing back the {wrongCount === 1 ? "question" : `${wrongCount} questions`} you
          missed — each paired with a similar question on the same concept, so we check the gap actually closed.
        </p>
        <button style={styles.primaryBtn} onClick={onStart}>Start recommended practice</button>
      </Panel>
    </div>
  );
}

function PracticeScreen({ practiceSet, index, answers, reveal, setReveal, onAnswer, onNext }) {
  const q = practiceSet[index];
  const answered = answers[q.id];
  return (
    <div style={styles.wrap}>
      <Panel width={620}>
        <QuestionTag extra={`${q.kind === "redo" ? "Same question, revisited" : "Similar question"} · ${index + 1} of ${practiceSet.length}`} />
        <h2 style={styles.h2}>{q.q}</h2>
        <div style={styles.optionGrid}>
          {q.options.map((opt) => {
            const isChosen = answered?.selected === opt;
            const showCorrect = answered && opt === q.correct;
            return (
              <button
                key={opt} className="opt-btn" disabled={!!answered}
                style={{ ...styles.optBtn, borderColor: showCorrect ? "#3E7C59" : isChosen ? "#B4472A" : "#DAD4C4", background: showCorrect ? "#EDF4EE" : isChosen ? "#FBEDE8" : "#fff" }}
                onClick={() => onAnswer(q, opt)}
              >{opt}</button>
            );
          })}
        </div>

        {answered && !answered.correct && (
          <div style={styles.mistakeBox}>
            <p style={styles.calloutLabel}>Let's understand the mistake</p>
            {reveal === "hint" && <p style={styles.body}>{q.hint}</p>}
            {reveal === "explain" && <p style={styles.body}>{q.explain}</p>}
            {!reveal && (
              <div style={styles.miniBtnRow}>
                <button style={styles.ghostBtn} onClick={() => setReveal("hint")}>Give hint</button>
                <button style={styles.ghostBtn} onClick={() => setReveal("explain")}>Explain</button>
              </div>
            )}
          </div>
        )}
        {answered && answered.correct && (
          <div style={{ ...styles.mistakeBox, borderColor: "#3E7C59" }}><p style={{ ...styles.calloutLabel, color: "#3E7C59" }}>Correct.</p></div>
        )}

        {answered && (
          <button style={{ ...styles.primaryBtn, marginTop: 20 }} onClick={onNext}>
            {index < practiceSet.length - 1 ? "Next question" : "See updated mastery"}
          </button>
        )}
      </Panel>
    </div>
  );
}

function CompareBar({ label, value, color }) {
  return (
    <div style={styles.compareBarRow}>
      <div style={styles.compareBarLabelRow}><span style={styles.barLabel}>{label}</span><span style={{ ...styles.barPct, fontWeight: 600, color }}>{value}%</span></div>
      <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${value}%`, background: color }} /></div>
    </div>
  );
}

function ReassessScreen({ before, after, onContinue }) {
  const beforePct = Math.round((before / MCQ.length) * 100);
  const afterPct = Math.round((after / MCQ.length) * 100);
  const delta = afterPct - beforePct;
  const improved = delta > 0;
  const declined = delta < 0;
  const afterColor = improved ? "#3E7C59" : declined ? "#B4472A" : "#C77D2E";
  return (
    <div style={styles.wrap}>
      <Panel width={620}>
        <p style={styles.stepTag}>Updated mastery · retest on missed + similar questions</p>
        <h2 style={styles.h2}>{TOPIC_LABEL}, before and after.</h2>
        <div style={{ margin: "24px 0 8px" }}>
          <CompareBar label="Before (diagnostic)" value={beforePct} color="#8B8474" />
          <CompareBar label="After (practice retest)" value={afterPct} color={afterColor} />
        </div>
        <p style={{ fontSize: 14, color: improved ? "#3E7C59" : declined ? "#B4472A" : "#9A9280", fontWeight: 600, margin: "4px 0 24px" }}>
          {improved && `↑ +${delta}% improvement`}
          {declined && `↓ ${delta}% — this gap hasn't closed yet`}
          {!improved && !declined && "No change from the diagnostic"}
        </p>
        <p style={styles.bodyMuted}>This retest score is tracked for your progress — your original diagnostic marks are what count toward this quiz's final score.</p>
        <button style={styles.primaryBtn} onClick={onContinue}>Continue to written questions</button>
      </Panel>
    </div>
  );
}

function SubjectiveRunner({ index, answers, setAnswers, onNext, onExit }) {
  const q = SUBJECTIVE_QUESTIONS[index];
  const current = answers[q.id];
  const progressPct = Math.round(((index + 1) / SUBJECTIVE_QUESTIONS.length) * 100);
  const canAdvance = current?.mode === "text" ? (current?.text || "").trim().length > 0 : current?.mode === "image" ? !!current?.fileName : false;

  return (
    <div style={styles.wrap}>
      <button style={styles.backLink} onClick={onExit}>← Exit to path</button>
      <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progressPct}%` }} /></div>
      <Panel width={640}>
        <QuestionTag extra={`Written · Question ${index + 1} of ${SUBJECTIVE_QUESTIONS.length} · ${q.marks} mark${q.marks > 1 ? "s" : ""}`} />
        <h2 style={styles.h2}>{q.q}</h2>
        <SubjectiveBlock value={current} onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))} />
        <button style={{ ...styles.primaryBtn, opacity: canAdvance ? 1 : 0.4, marginTop: 24 }} disabled={!canAdvance} onClick={onNext}>
          {index < SUBJECTIVE_QUESTIONS.length - 1 ? "Next question" : "Submit & see results"}
        </button>
      </Panel>
    </div>
  );
}

function SubjectiveBlock({ value, onChange }) {
  const mode = value?.mode || "text";
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ mode: "image", file, fileName: file.name, previewUrl: URL.createObjectURL(file) });
  };
  return (
    <div>
      <div style={styles.toggleRow}>
        <button style={{ ...styles.toggleBtn, ...(mode === "text" ? styles.toggleBtnActive : {}) }} onClick={() => onChange({ mode: "text", text: value?.text || "" })}>Type answer</button>
        <button style={{ ...styles.toggleBtn, ...(mode === "image" ? styles.toggleBtnActive : {}) }} onClick={() => onChange({ mode: "image", fileName: value?.fileName, previewUrl: value?.previewUrl, file: value?.file })}>Upload photo</button>
      </div>
      {mode === "text" && (
        <textarea style={styles.textarea} rows={5} placeholder="Write your working and final answer here..." value={value?.text || ""} onChange={(e) => onChange({ mode: "text", text: e.target.value })} />
      )}
      {mode === "image" && (
        <div>
          <label className="file-label" style={styles.fileLabel}>
            {value?.fileName ? `Selected: ${value.fileName}` : "Choose a photo of your written answer"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </label>
          {value?.previewUrl && <img src={value.previewUrl} alt="Answer preview" style={styles.imgPreview} />}
        </div>
      )}
    </div>
  );
}

function ResultsScreen({ mcqBefore, mcqAfter, subjAnswers, onContinue }) {
  const [grades, setGrades] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(SUBJECTIVE_QUESTIONS.map((q) => gradeSubjective(q, subjAnswers[q.id]))).then((res) => { if (!cancelled) setGrades(res); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (grades === null) {
    return (
      <div style={styles.wrap}>
        <Panel width={640}>
          <QuestionTag extra="Results" />
          <h2 style={styles.h2}>Checking your written answers…</h2>
          <p style={styles.calloutText}>Comparing your typed and uploaded answers against the expected working. A few seconds.</p>
        </Panel>
      </div>
    );
  }

  const subjective = SUBJECTIVE_QUESTIONS.map((q, i) => ({ ...q, ...grades[i] }));
  const subjectiveAwarded = subjective.reduce((s, q) => s + q.awarded, 0);
  const total = mcqBefore + subjectiveAwarded;

  return (
    <div style={styles.wrap}>
      <Panel width={640}>
        <QuestionTag extra="Results" />
        <h2 style={styles.h2}>{total} / {MAX_MARKS} marks</h2>

        <div style={styles.resultRow}>
          <span style={styles.barLabel}>MCQ (diagnostic, auto-graded)</span>
          <span style={styles.barPct}>{mcqBefore} / {MCQ.length}</span>
        </div>
        {mcqAfter !== null && (
          <div style={styles.resultRow}>
            <span style={{ ...styles.barLabel, color: "#8B8474" }}>Practice retest (tracked, not counted)</span>
            <span style={{ ...styles.barPct, color: "#8B8474" }}>{mcqAfter} / {MCQ.length}</span>
          </div>
        )}

        {subjective.map((q) => (
          <div key={q.id} style={styles.resultBlock}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={styles.barLabel}>{q.marks}-mark question — {q.status}</span>
              <span style={styles.barPct}>{q.awarded} / {q.marks}</span>
            </div>
            {q.feedback && <p style={styles.feedbackLine}>{q.feedback}</p>}
          </div>
        ))}

        <div style={{ ...styles.calloutBox, marginTop: 20 }}>
          <p style={styles.calloutLabel}>About subjective scoring</p>
          <p style={styles.calloutText}>Typed and uploaded answers are actually checked against the expected reasoning for each question — a blank or nonsense answer gets 0, not a free score.</p>
        </div>

        <button style={styles.primaryBtn} onClick={onContinue}>Back to path</button>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Improvement / Quiz Marks / Notes pages
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DPP — Daily Practice Problems, generated on demand for any topic the
// student has completed in Explore. Cached per topic per day.
// ---------------------------------------------------------------------------

function DppPage({ completedNodes }) {
  const completedTopics = [];
  Object.keys(completedNodes).forEach((chapterId) => {
    const chapterName = CHAPTERS.find((c) => c.id === chapterId)?.name;
    const nodes = CHAPTER_PATHS[chapterId] || [];
    (completedNodes[chapterId] || []).forEach((done, i) => {
      if (done && nodes[i]) completedTopics.push({ key: `${chapterId}::${nodes[i].id}`, chapterId, chapterName, nodeName: nodes[i].name });
    });
  });

  const [selectedKey, setSelectedKey] = useState(completedTopics[0]?.key || "");
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});

  const selected = completedTopics.find((t) => t.key === selectedKey);

  useEffect(() => {
    if (!selected) { setResult(null); return; }
    let cancelled = false;
    const storageKey = `cerevia-dpp-${selected.key}-${todayKey()}`;
    setAnswers({});
    (async () => {
      setResult({ status: "loading" });
      try {
        const stored = await storage.get(storageKey);
        if (stored && stored.value) {
          if (!cancelled) setResult(JSON.parse(stored.value));
          return;
        }
      } catch (err) {
        // nothing generated for today yet
      }
      const generated = await generateDppQuestions(selected.chapterName, selected.nodeName);
      if (!cancelled) setResult(generated);
      if (generated.status === "done") {
        storage.set(storageKey, JSON.stringify(generated)).catch(() => {});
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter(Boolean).length;

  return (
    <div>
      <h1 style={styles.pageH1}>Daily Practice Problems</h1>
      <p style={styles.pageSub}>10 fresh MCQs a day, on a topic you've already completed. Same set all day, new set tomorrow.</p>

      {completedTopics.length === 0 ? (
        <div style={styles.calloutBox}>
          <p style={styles.calloutLabel}>Nothing to practice yet</p>
          <p style={styles.calloutText}>Complete a topic in Explore first — DPP draws from what you've already learned.</p>
        </div>
      ) : (
        <>
          <select style={styles.dropdown} value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
            {completedTopics.map((t) => (
              <option key={t.key} value={t.key}>{t.chapterName} — {t.nodeName}</option>
            ))}
          </select>

          {result?.status === "loading" && <p style={styles.stubLine}>Putting together today's 10 questions…</p>}
          {result?.status === "error" && <p style={styles.stubLine}>Couldn't generate today's set — try switching topics and back.</p>}
          {result?.status === "done" && (
            <div>
              <p style={styles.dppScore}>Score: {correctCount} / {answeredCount} answered correctly ({answeredCount}/10 attempted)</p>
              {result.data.map((q, i) => (
                <DppQuestionItem
                  key={i} index={i} question={q}
                  selected={answers[i]}
                  onSelect={(opt) => setAnswers((prev) => ({ ...prev, [i]: opt === q.correct }))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DppQuestionItem({ index, question, selected, onSelect }) {
  const [choice, setChoice] = useState(null);
  return (
    <div style={styles.genQuizItem}>
      <p style={styles.genQuizQ}>{index + 1}. {question.q}</p>
      <div style={styles.optionGrid}>
        {question.options.map((opt) => {
          const isChosen = choice === opt;
          const showCorrect = choice && opt === question.correct;
          return (
            <button
              key={opt} className="opt-btn"
              style={{ ...styles.optBtn, borderColor: showCorrect ? "#3E7C59" : isChosen ? "#B4472A" : "#DAD4C4", background: showCorrect ? "#EDF4EE" : isChosen && opt !== question.correct ? "#FBEDE8" : "#fff" }}
              onClick={() => { setChoice(opt); onSelect(opt); }}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignments — stubbed for now; structure is real, content is mock.
// ---------------------------------------------------------------------------

const ASSIGNMENTS = [
  { title: "Trigonometric Ratios — Worksheet 3", chapter: "Trigonometry", due: "12 Sep 2026", status: "Pending" },
  { title: "Linear Equations — Word Problems", chapter: "Algebra", due: "09 Sep 2026", status: "Submitted" },
  { title: "Triangles — Proof Practice", chapter: "Geometry", due: "05 Sep 2026", status: "Overdue" },
];

function AssignmentsPage() {
  return (
    <div>
      <h1 style={styles.pageH1}>Assignments</h1>
      <p style={styles.pageSub}>Work set by your teacher, tracked alongside everything else.</p>
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <span style={{ ...styles.th, flex: 2 }}>Assignment</span>
          <span style={{ ...styles.th, flex: 1 }}>Chapter</span>
          <span style={{ ...styles.th, flex: 1 }}>Due</span>
          <span style={{ ...styles.th, flex: 1, textAlign: "right" }}>Status</span>
        </div>
        {ASSIGNMENTS.map((a, i) => (
          <div key={i} style={styles.tableRow}>
            <span style={{ ...styles.td, flex: 2 }}>{a.title}</span>
            <span style={{ ...styles.td, flex: 1 }}>{a.chapter}</span>
            <span style={{ ...styles.td, flex: 1 }}>{a.due}</span>
            <span style={{ ...styles.td, flex: 1, textAlign: "right" }}>
              <StatusPill status={a.status === "Submitted" ? "Passed" : a.status === "Overdue" ? "Needs review" : "Baseline"} />
            </span>
          </div>
        ))}
      </div>
      <p style={styles.stubLine}>Submitting work and teacher-side assignment creation are coming soon — this view is wired up but the content is a mock.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress — real, live-tracked time in the app, shown as a daily bar chart.
// ---------------------------------------------------------------------------

function ProgressPage({ timeSpentMap }) {
  const days = getLastNDays(7).map((d) => ({ ...d, hours: +(timeSpentMap[d.dateKey] || 0).toFixed(2) }));
  const totalWeek = days.reduce((s, d) => s + d.hours, 0);
  const today = days[days.length - 1];
  const avg = totalWeek / 7;

  return (
    <div>
      <h1 style={styles.pageH1}>Progress</h1>
      <p style={styles.pageSub}>Time actually spent in CEREVIA, tracked live while the app is open.</p>

      <div style={styles.statRow}>
        <StatCard label="Today" value={`${today.hours.toFixed(1)}h`} />
        <StatCard label="This week" value={`${totalWeek.toFixed(1)}h`} />
        <StatCard label="Daily average" value={`${avg.toFixed(1)}h`} />
      </div>

      <div style={styles.chartCard}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={days} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#EDE9DE" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12.5, fill: "#6B6558" }} axisLine={{ stroke: "#DAD4C4" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12.5, fill: "#6B6558" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ border: "1px solid #E4DFD3", fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }} formatter={(v) => [`${v}h`, "Time spent"]} />
            <Bar dataKey="hours" fill="#1E2A4A" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p style={styles.stubLine}>Today's bar updates live while this tab stays open and visible — the rest of the week is prior-session data.</p>
    </div>
  );
}

function OverviewPage({ topicScores }) {
  const latest = IMPROVEMENT_DATA[IMPROVEMENT_DATA.length - 1];
  const first = IMPROVEMENT_DATA[0];
  const overallAvg = Math.round((latest.Trigonometry + latest.Algebra + latest.Geometry) / 3);
  const [openChapter, setOpenChapter] = useState(null);

  return (
    <div>
      <h1 style={styles.pageH1}>Improvement over time</h1>
      <p style={styles.pageSub}>Mastery per topic, tracked across every quiz.</p>

      <div style={styles.statRow}>
        <StatCard label="Overall mastery" value={`${overallAvg}%`} />
        <StatCard label="Biggest gain" value="Trigonometry" sub={`+${latest.Trigonometry - first.Trigonometry}% since Quiz 1`} />
        <StatCard label="Quizzes completed" value={QUIZ_HISTORY.length} />
      </div>

      <div style={styles.chartCard}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={IMPROVEMENT_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#EDE9DE" vertical={false} />
            <XAxis dataKey="quiz" tick={{ fontSize: 12.5, fill: "#6B6558" }} axisLine={{ stroke: "#DAD4C4" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12.5, fill: "#6B6558" }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={{ border: "1px solid #E4DFD3", fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif" }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line type="monotone" dataKey="Trigonometry" stroke="#B4472A" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Algebra" stroke="#3E7C59" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Geometry" stroke="#C77D2E" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 style={styles.subHeading}>By chapter and topic</h2>
      <div style={styles.accordionWrap}>
        {CHAPTERS.map((c) => {
          const topics = CHAPTER_PATHS[c.id];
          const isOpen = openChapter === c.id;
          const avg = Math.round(topics.reduce((s, t) => s + getTopicMastery(topicScores, c.id, t.id, t.mastery), 0) / topics.length);
          return (
            <div key={c.id} style={styles.accordionCard}>
              <button style={styles.accordionHeader} onClick={() => setOpenChapter(isOpen ? null : c.id)}>
                <span style={styles.accordionTitle}>{c.name}</span>
                <span style={styles.accordionRight}>
                  <span style={{ ...styles.pill, color: masteryColor(avg), borderColor: masteryColor(avg) }}>{avg}% avg</span>
                  <span style={styles.accordionChevron}>{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>
              {isOpen && (
                <div style={styles.accordionBody}>
                  {topics.map((t) => {
                    const m = getTopicMastery(topicScores, c.id, t.id, t.mastery);
                    return (
                      <div key={t.id} style={styles.topicRow}>
                        <ProgressRing percent={m} size={56} />
                        <div style={{ flex: 1 }}>
                          <p style={styles.topicName}>{t.name}</p>
                          <span style={{ ...styles.pill, color: masteryColor(m), borderColor: masteryColor(m) }}>{statusLabel(m)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
      {sub && <p style={styles.statSub}>{sub}</p>}
    </div>
  );
}

function PersonalizedPathPage({ topicScores, setPage }) {
  const [chapterId, setChapterId] = useState(CHAPTERS[0].id);
  const topics = CHAPTER_PATHS[chapterId]
    .map((t) => ({ ...t, mastery: getTopicMastery(topicScores, chapterId, t.id, t.mastery) }))
    .sort((a, b) => a.mastery - b.mastery);
  const totalHours = topics.reduce((s, t) => s + estimateHours(t.mastery), 0);
  const chapterName = CHAPTERS.find((c) => c.id === chapterId)?.name;

  return (
    <div>
      <h1 style={styles.pageH1}>Personalized learning path</h1>
      <p style={styles.pageSub}>Weakest topics first, with an honest time estimate to master each one.</p>

      <select style={styles.dropdown} value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
        {CHAPTERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div style={styles.calloutBox}>
        <p style={styles.calloutLabel}>Estimated time to master {chapterName}</p>
        <p style={styles.calloutText}>{totalHours}h total, across {topics.length} topics</p>
      </div>

      <div style={styles.tableCard}>
        {topics.map((t, i) => (
          <div key={t.id} style={styles.pathTopicRow}>
            <span style={styles.pathTopicNum}>{i + 1}</span>
            <ProgressRing percent={t.mastery} size={48} />
            <div style={{ flex: 1 }}>
              <p style={styles.topicName}>{t.name}</p>
              <span style={{ ...styles.pill, color: masteryColor(t.mastery), borderColor: masteryColor(t.mastery) }}>{statusLabel(t.mastery)}</span>
            </div>
            <span style={styles.pathTopicHours}>{estimateHours(t.mastery)}h</span>
          </div>
        ))}
      </div>

      <button style={{ ...styles.primaryBtn, marginTop: 20, width: "auto", padding: "12px 26px" }} onClick={() => setPage("explore")}>
        Start with {topics[0].name}
      </button>
    </div>
  );
}

function QuizzesPage() {
  return (
    <div>
      <h1 style={styles.pageH1}>Quiz marks</h1>
      <p style={styles.pageSub}>Every attempt, scored and dated.</p>
      <div style={styles.tableCard}>
        <div style={styles.tableHeaderRow}>
          <span style={{ ...styles.th, flex: 1.1 }}>Date</span>
          <span style={{ ...styles.th, flex: 1.3 }}>Chapter</span>
          <span style={{ ...styles.th, flex: 1.6 }}>Topic</span>
          <span style={{ ...styles.th, flex: 0.9, textAlign: "right" }}>Score</span>
          <span style={{ ...styles.th, flex: 1.1, textAlign: "right" }}>Status</span>
        </div>
        {QUIZ_HISTORY.slice().reverse().map((q, i) => (
          <div key={i} style={styles.tableRow}>
            <span style={{ ...styles.td, flex: 1.1 }}>{q.date}</span>
            <span style={{ ...styles.td, flex: 1.3 }}>{q.chapter}</span>
            <span style={{ ...styles.td, flex: 1.6 }}>{q.topic}</span>
            <span style={{ ...styles.td, flex: 0.9, textAlign: "right", fontWeight: 600 }}>{q.score}/{q.max}</span>
            <span style={{ ...styles.td, flex: 1.1, textAlign: "right" }}><StatusPill status={q.status} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const color = status === "Passed" ? "#3E7C59" : status === "Needs review" ? "#B4472A" : "#8B8474";
  return <span style={{ ...styles.pill, color, borderColor: color }}>{status}</span>;
}

function NotesPage({ notes, onUpload }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [activeKind, setActiveKind] = useState("notes");
  const [cache, setCache] = useState({});

  useEffect(() => {
    if (openIndex === null) return;
    const note = notes[openIndex];
    const noteKey = note.id || `idx-${openIndex}`;
    const cacheKey = `${noteKey}-${activeKind}`;
    if (cache[cacheKey]) return;

    let cancelled = false;
    (async () => {
      setCache((prev) => ({ ...prev, [cacheKey]: { status: "loading" } }));

      // Check for a previously generated + saved result first.
      try {
        const stored = await storage.get(`cerevia-gen-${cacheKey}`);
        if (stored && stored.value) {
          const parsed = JSON.parse(stored.value);
          if (!cancelled) setCache((prev) => ({ ...prev, [cacheKey]: parsed }));
          return;
        }
      } catch (err) {
        // nothing saved yet — generate fresh below
      }

      const result = await generateFromNote(note, activeKind);
      if (!cancelled) setCache((prev) => ({ ...prev, [cacheKey]: result }));
      if (result.status === "done") {
        storage.set(`cerevia-gen-${cacheKey}`, JSON.stringify(result)).catch(() => {});
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, activeKind]);

  const regenerate = () => {
    const note = notes[openIndex];
    const noteKey = note.id || `idx-${openIndex}`;
    const cacheKey = `${noteKey}-${activeKind}`;
    setCache((prev) => { const c = { ...prev }; delete c[cacheKey]; return c; });
    storage.delete(`cerevia-gen-${cacheKey}`).catch(() => {});
  };

  const activeKey = openIndex !== null ? (notes[openIndex].id || `idx-${openIndex}`) + "-" + activeKind : null;
  const activeResult = activeKey ? cache[activeKey] : null;

  return (
    <div>
      <h1 style={styles.pageH1}>Uploaded notes</h1>
      <p style={styles.pageSub}>Your own study material, in one place — turn any file into notes, a quiz, or a formula sheet.</p>

      <label className="file-label" style={styles.uploadCard}>
        Upload a new file
        <input type="file" style={{ display: "none" }} onChange={onUpload} />
      </label>

      <div style={styles.tableCard}>
        {notes.map((n, i) => (
          <div key={i} style={styles.tableRow}>
            <span style={{ ...styles.td, flex: 2.4 }}>{n.name}</span>
            <span style={{ ...styles.td, flex: 1, color: "#8B8474" }}>{n.size}</span>
            <span style={{ ...styles.td, flex: 1, color: "#8B8474" }}>{n.date}</span>
            <span style={{ ...styles.td, flex: 0.8, textAlign: "right" }}>
              <button
                style={styles.openBtn}
                onClick={() => { setOpenIndex(i); setActiveKind("notes"); }}
              >
                {openIndex === i ? "Open" : "Open"}
              </button>
            </span>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <div style={styles.workspaceCard}>
          <div style={styles.workspaceHeader}>
            <div>
              <p style={styles.workspaceEyebrow}>Generated from</p>
              <p style={styles.workspaceTitle}>{notes[openIndex].name}</p>
            </div>
            <button style={styles.closeBtn} onClick={() => setOpenIndex(null)}>Close</button>
          </div>

          <select style={styles.dropdown} value={activeKind} onChange={(e) => setActiveKind(e.target.value)}>
            <option value="notes">Notes</option>
            <option value="quiz">Quiz</option>
            <option value="formula">Formula Book</option>
          </select>

          <div style={styles.workspaceBody}>
            <GeneratedContent kind={activeKind} result={activeResult} onRetry={regenerate} />
          </div>
        </div>
      )}
    </div>
  );
}

function GeneratedContent({ kind, result, onRetry }) {
  if (!result || result.status === "loading") {
    return <p style={styles.stubLine}>Reading the file and generating your {kind === "formula" ? "formula book" : kind}…</p>;
  }
  if (result.status === "unsupported") {
    return <p style={styles.stubLine}>This file type isn't readable for AI generation yet — try uploading a PDF, image, or plain text (.txt/.md) file.</p>;
  }
  if (result.status === "too-large") {
    return <p style={styles.stubLine}>This file is over the 4 MB demo limit — try a smaller file.</p>;
  }
  if (result.status === "error") {
    return (
      <div>
        <p style={styles.stubLine}>Couldn't generate that right now.</p>
        <button style={styles.openBtn} onClick={onRetry}>Try again</button>
      </div>
    );
  }

  const body =
    kind === "notes" ? (
      <div>{result.data.split("\n").filter((line) => line.trim()).map((line, i) => <p key={i} style={styles.genParagraph}>{line}</p>)}</div>
    ) : kind === "formula" ? (
      <ul style={styles.genFormulaList}>{result.data.map((f, i) => <li key={i} style={styles.genFormulaItem}>{f}</li>)}</ul>
    ) : (
      <div>{result.data.map((q, i) => <QuizPreviewItem key={i} index={i} question={q} />)}</div>
    );

  return (
    <div>
      {body}
      <button style={{ ...styles.openBtn, marginTop: 8 }} onClick={onRetry}>Regenerate</button>
    </div>
  );
}

function QuizPreviewItem({ index, question }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={styles.genQuizItem}>
      <p style={styles.genQuizQ}>{index + 1}. {question.q}</p>
      <div style={styles.optionGrid}>
        {question.options.map((opt) => {
          const isChosen = selected === opt;
          const showCorrect = selected && opt === question.correct;
          return (
            <button
              key={opt} className="opt-btn"
              style={{ ...styles.optBtn, borderColor: showCorrect ? "#3E7C59" : isChosen ? "#B4472A" : "#DAD4C4", background: showCorrect ? "#EDF4EE" : isChosen && opt !== question.correct ? "#FBEDE8" : "#fff" }}
              onClick={() => setSelected(opt)}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  app: { minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif", background: "#F6F3ED", color: "#1E2A4A" },

  loginWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  loginPanel: { display: "flex", width: "100%", maxWidth: 820, minHeight: 460, border: "1px solid #E4DFD3", overflow: "hidden" },
  loginBrand: { flex: 1, background: "#1E2A4A", color: "#F6F3ED", padding: "44px 38px", display: "flex", flexDirection: "column", justifyContent: "center" },
  brandLogo: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: 3, margin: "0 0 16px" },
  brandBody: { fontSize: 14.5, lineHeight: 1.6, color: "#C9C2B2", margin: 0 },
  loginFormSide: { flex: 1, background: "#fff", padding: "44px 38px", display: "flex", flexDirection: "column", justifyContent: "center" },

  tabRow: { display: "flex", gap: 22, marginBottom: 22, borderBottom: "1px solid #E4DFD3" },
  tabBtn: { background: "none", border: "none", padding: "0 0 12px", fontSize: 14.5, fontWeight: 500, color: "#9A9280", borderBottom: "2px solid transparent" },
  tabBtnActive: { color: "#1E2A4A", borderBottom: "2px solid #1E2A4A" },

  label: { display: "block", fontSize: 12.5, color: "#6B6558", margin: "0 0 6px", fontWeight: 500 },
  input: { width: "100%", padding: "10px 12px", fontSize: 14.5, border: "1px solid #DAD4C4", marginBottom: 16, color: "#1E2A4A", outline: "none", background: "#fff" },
  errorText: { fontSize: 13, color: "#B4472A", margin: "-8px 0 14px" },
  primaryBtn: { width: "100%", background: "#1E2A4A", color: "#F6F3ED", border: "none", padding: "12px 22px", fontSize: 14.5, fontWeight: 500, marginTop: 4 },
  demoHint: { fontSize: 12.5, color: "#9A9280", marginTop: 14, textAlign: "center" },

  dashWrap: { display: "flex", minHeight: "100vh" },
  sidebar: { width: 220, background: "#1E2A4A", color: "#F6F3ED", padding: "22px 16px", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarLogo: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: 2, margin: "4px 0 22px 8px" },
  sidebarLogoBtn: {
    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: 2,
    margin: "4px 0 22px 8px", background: "none", border: "none", color: "#F6F3ED", padding: 0, textAlign: "left", cursor: "pointer",
  },
  userBlock: { display: "flex", alignItems: "center", gap: 10, padding: "0 8px 22px", borderBottom: "1px solid rgba(246,243,237,0.15)", marginBottom: 18 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "#C77D2E", color: "#1E2A4A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName: { fontSize: 14, fontWeight: 600, margin: 0 },
  userMeta: { fontSize: 11.5, color: "#B9C0D4", margin: "2px 0 0" },
  nav: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  navBtn: { textAlign: "left", background: "transparent", border: "none", color: "#F6F3ED", padding: "10px 10px", fontSize: 14, borderRadius: 3 },
  logoutBtn: { textAlign: "left", background: "transparent", border: "none", color: "#B9C0D4", fontSize: 13, padding: "10px 10px", borderTop: "1px solid rgba(246,243,237,0.15)", marginTop: 12 },

  main: { flex: 1, padding: "38px 44px", maxWidth: 980, overflowY: "auto" },
  pageH1: { fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 600, margin: "0 0 6px", color: "#1E2A4A" },
  pageSub: { fontSize: 14, color: "#8B8474", margin: "0 0 26px" },

  statRow: { display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" },
  statCard: { flex: "1 1 160px", background: "#fff", border: "1px solid #E4DFD3", padding: "16px 18px" },
  statLabel: { fontSize: 12, color: "#9A9280", margin: "0 0 6px" },
  statValue: { fontSize: 24, fontWeight: 700, margin: 0, color: "#1E2A4A", fontFamily: "'Source Serif 4', serif" },
  statSub: { fontSize: 12, color: "#3E7C59", margin: "6px 0 0", fontWeight: 500 },
  chartCard: { background: "#fff", border: "1px solid #E4DFD3", padding: "20px 16px 8px" },

  tableCard: { background: "#fff", border: "1px solid #E4DFD3" },
  tableHeaderRow: { display: "flex", padding: "12px 18px", borderBottom: "1px solid #E4DFD3", background: "#FBF9F4" },
  th: { fontSize: 12, fontWeight: 600, color: "#6B6558", textTransform: "uppercase", letterSpacing: 0.3 },
  tableRow: { display: "flex", padding: "13px 18px", borderBottom: "1px solid #EDE9DE", alignItems: "center" },
  td: { fontSize: 14, color: "#1E2A4A" },
  pill: { fontSize: 11.5, fontWeight: 600, border: "1px solid", padding: "3px 9px", borderRadius: 20, display: "inline-block" },

  uploadCard: { display: "block", padding: "18px", fontSize: 14, textAlign: "center", marginBottom: 20, border: "1.5px dashed #C9C2B2", color: "#6B6558", background: "#FBF9F4", cursor: "pointer" },
  stubLine: { fontSize: 13, color: "#8B8474", marginTop: 14, fontStyle: "italic" },

  openBtn: { padding: "5px 12px", fontSize: 12.5, border: "1px solid #1E2A4A", color: "#1E2A4A", background: "#fff", fontWeight: 500 },
  workspaceCard: { background: "#fff", border: "1px solid #E4DFD3", marginTop: 20, padding: "22px 24px" },
  workspaceHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  workspaceEyebrow: { fontSize: 12, color: "#9A9280", margin: "0 0 2px" },
  workspaceTitle: { fontSize: 15.5, fontWeight: 600, margin: 0, color: "#1E2A4A" },
  closeBtn: { background: "none", border: "none", color: "#6B6558", fontSize: 13, padding: 0 },
  dropdown: { padding: "9px 12px", fontSize: 14, border: "1px solid #DAD4C4", color: "#1E2A4A", background: "#fff", marginBottom: 18 },

  subHeading: { fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 600, color: "#1E2A4A", margin: "30px 0 14px" },
  accordionWrap: { display: "flex", flexDirection: "column", gap: 10 },
  accordionCard: { background: "#fff", border: "1px solid #E4DFD3" },
  accordionHeader: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 18px", background: "none", border: "none", textAlign: "left",
  },
  accordionTitle: { fontSize: 15, fontWeight: 600, color: "#1E2A4A" },
  accordionRight: { display: "flex", alignItems: "center", gap: 12 },
  accordionChevron: { fontSize: 10, color: "#9A9280" },
  accordionBody: { borderTop: "1px solid #EDE9DE", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 },
  topicRow: { display: "flex", alignItems: "center", gap: 16 },
  topicName: { fontSize: 14, fontWeight: 500, color: "#1E2A4A", margin: "0 0 6px" },

  pathTopicRow: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid #EDE9DE" },
  pathTopicNum: { fontSize: 13, fontWeight: 700, color: "#9A9280", width: 18, flexShrink: 0 },
  pathTopicHours: { fontSize: 13.5, fontWeight: 600, color: "#1E2A4A", flexShrink: 0 },
  workspaceBody: { borderTop: "1px solid #EDE9DE", paddingTop: 16 },
  genParagraph: { fontSize: 14.5, lineHeight: 1.6, color: "#3A3527", margin: "0 0 10px" },
  genFormulaList: { margin: 0, paddingLeft: 18 },
  genFormulaItem: { fontSize: 14.5, lineHeight: 1.9, color: "#3A3527" },
  genQuizItem: { marginBottom: 22 },
  genQuizQ: { fontSize: 14.5, fontWeight: 600, color: "#1E2A4A", margin: "0 0 10px" },
  dppScore: { fontSize: 13.5, fontWeight: 600, color: "#1E2A4A", background: "#FBF6EC", border: "1px solid #E4DFD3", padding: "8px 14px", display: "inline-block", marginBottom: 18 },

  wrap: { maxWidth: 760, margin: "0 auto" },
  eyebrow: { fontSize: 12.5, color: "#9A9280", margin: "0 0 4px" },
  h1: { fontFamily: "'Source Serif 4', serif", fontSize: 30, fontWeight: 600, margin: "0 0 24px", lineHeight: 1.2 },
  h2: { fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 600, margin: "6px 0 18px", lineHeight: 1.3 },
  simpleH1: { fontSize: 22, fontWeight: 600, margin: "10px 0 20px", color: "#1E2A4A" },
  backLink: { background: "none", border: "none", color: "#6B6558", fontSize: 13.5, padding: 0, marginBottom: 14 },
  body: { fontSize: 15.5, lineHeight: 1.6, color: "#3A3527", margin: "0 0 14px" },
  bodyMuted: { fontSize: 14, lineHeight: 1.6, color: "#8B8474", margin: "12px 0 0", fontStyle: "italic" },
  stepTag: { fontSize: 12.5, color: "#9A9280", margin: "0 0 4px", letterSpacing: 0.2 },

  plainBtnRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  plainBtn: { padding: "12px 20px", fontSize: 14.5, background: "#fff", border: "1px solid #DAD4C4", color: "#1E2A4A", fontWeight: 500 },

  btnPairRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  uploadBtn: { display: "inline-block", padding: "10px 16px", fontSize: 13.5, fontWeight: 500, border: "1px solid #1E2A4A", color: "#1E2A4A", background: "#fff" },

  formulaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 },
  formulaCard: { background: "#fff", border: "1px solid #E4DFD3", padding: "14px 16px" },
  formulaChapterName: { fontSize: 13.5, fontWeight: 600, margin: "0 0 8px" },
  formulaList: { margin: 0, paddingLeft: 16 },
  formulaItem: { fontSize: 12.5, color: "#3A3527", lineHeight: 1.6 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 },
  chapterCard: { textAlign: "left", background: "#fff", border: "1px solid #E4DFD3", padding: "18px 18px 16px", transition: "transform 0.15s" },
  chapterName: { fontSize: 15.5, fontWeight: 600, margin: "0 0 12px" },
  chapterBarTrack: { height: 7, background: "#EDE9DE", width: "100%" },
  chapterBarFill: { height: 7 },
  chapterPct: { fontSize: 12.5, color: "#8B8474", margin: "8px 0 0" },

  pathHint: { fontSize: 13.5, color: "#8B8474", margin: "-16px 0 26px" },
  flow: { display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0 30px" },
  flowItem: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 380 },
  flowBox: { width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", border: "2px solid", background: "#fff", textAlign: "left", transition: "transform 0.15s" },
  flowBadge: { width: 30, height: 30, borderRadius: "50%", color: "#F6F3ED", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  flowBoxText: { display: "flex", flexDirection: "column", gap: 2 },
  flowBoxName: { fontSize: 15, fontWeight: 600 },
  flowBoxStatus: { fontSize: 12, fontWeight: 500 },
  flowConnector: { display: "flex", flexDirection: "column", alignItems: "center", height: 30 },
  flowLine: { width: 2, height: 18 },
  flowArrow: { width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid", marginTop: -1 },

  panel: { width: "100%", background: "#FFFFFF", border: "1px solid #E4DFD3", padding: "40px 40px 36px" },
  progressTrack: { height: 6, background: "#EDE9DE", width: "100%", marginBottom: 24 },
  progressFill: { height: 6, background: "#1E2A4A", transition: "width 0.2s" },

  optionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 },
  optBtn: { textAlign: "left", padding: "13px 16px", fontSize: 14.5, border: "1px solid #DAD4C4", background: "#fff", color: "#1E2A4A" },

  calloutBox: { borderLeft: "3px solid #C77D2E", background: "#FBF6EC", padding: "14px 18px", margin: "8px 0 20px" },
  calloutLabel: { fontSize: 12, color: "#9A6A2A", margin: "0 0 4px", fontWeight: 600 },
  calloutText: { fontSize: 14.5, margin: 0, color: "#1E2A4A", lineHeight: 1.5 },
  mistakeBox: { border: "1px solid #E4DFD3", borderLeft: "3px solid #B4472A", padding: "16px 18px", marginTop: 16 },
  miniBtnRow: { display: "flex", gap: 10, marginTop: 4 },
  ghostBtn: { background: "transparent", color: "#1E2A4A", border: "1px solid #1E2A4A", padding: "9px 16px", fontSize: 13.5, fontWeight: 500 },

  compareBarRow: { marginBottom: 16 },
  compareBarLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  barTrack: { height: 8, background: "#EDE9DE", width: "100%" },
  barFill: { height: 8 },

  toggleRow: { display: "flex", gap: 8, marginBottom: 14 },
  toggleBtn: { padding: "8px 16px", fontSize: 13.5, background: "#fff", border: "1px solid #DAD4C4", color: "#6B6558", fontWeight: 500 },
  toggleBtnActive: { background: "#1E2A4A", color: "#F6F3ED", borderColor: "#1E2A4A" },
  textarea: { width: "100%", padding: 14, fontSize: 14.5, fontFamily: "'IBM Plex Sans', sans-serif", border: "1px solid #DAD4C4", resize: "vertical", color: "#1E2A4A" },
  fileLabel: { display: "block", padding: "16px 18px", fontSize: 14, textAlign: "center", border: "1.5px dashed #C9C2B2", color: "#6B6558", background: "#FBF9F4" },
  imgPreview: { marginTop: 12, maxWidth: "100%", maxHeight: 220, border: "1px solid #E4DFD3" },

  resultRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #EDE9DE", fontSize: 14 },
  resultBlock: { padding: "10px 0", borderBottom: "1px solid #EDE9DE" },
  feedbackLine: { fontSize: 12.5, color: "#8B8474", margin: "4px 0 0", fontStyle: "italic" },
  barLabel: { fontSize: 14.5 },
  barPct: { fontSize: 13.5, color: "#6B6558", fontWeight: 600 },
};
