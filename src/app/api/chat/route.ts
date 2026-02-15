import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/* ----------------------------- */
/* 🔐 CORS HEADERS               */
/* ----------------------------- */
function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://www.jamesjasonflores.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

/* ----------------------------- */
/* 🟢 Handle Preflight           */
/* ----------------------------- */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

/* ----------------------------- */
/* 🧠 V3 INTELLIGENCE LAYER      */
/* ----------------------------- */

/**
 * Normalize common misspellings / wrong-name inputs to keep the assistant grounded.
 * (Lightweight + deterministic; avoids regressions.)
 */
function normalizeUserText(raw: string) {
  if (!raw) return raw
  let t = raw.trim()

  // Normalize whitespace
  t = t.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n")

  // If user misspells or uses other names (like "Jada"), keep assistant anchored to James.
  // Do NOT rewrite inside code blocks, but you aren't sending code here anyway.
  t = t.replace(/\bJada\b/gi, "James")
  t = t.replace(/\bJame?s?\b/gi, "James") // Jame, James, Jams (partial help)
  t = t.replace(/\bJame\s+Flores\b/gi, "James Flores")
  t = t.replace(/\bJames\s+Flore?s\b/gi, "James Flores")

  // Normalize the site owner's name variations
  t = t.replace(/\bJames\s+Jason\s+Flores\b/gi, "James Flores")

  return t
}

function lastUserMessage(messages: any[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user" && typeof messages[i]?.content === "string") {
      return messages[i].content as string
    }
  }
  return ""
}

/**
 * Detect JD-related intent (role fit / analyze JD / tailor resume / match role).
 */
function isJDIntent(text: string) {
  const t = text.toLowerCase()
  return (
    t.includes("job description") ||
    t.includes("jd") ||
    t.includes("role fit") ||
    t.includes("fit into this role") ||
    t.includes("fit for this role") ||
    t.includes("fit with this role") ||
    t.includes("match this role") ||
    t.includes("tailor") ||
    t.includes("ats") ||
    t.includes("requirements") ||
    t.includes("qualifications") ||
    t.includes("how do i align") ||
    t.includes("how would he fit") ||
    t.includes("how would james fit") ||
    t.includes("positioning for this role")
  )
}

/**
 * Heuristic: does the user actually provide a JD block?
 * We treat as "present" if they include enough length OR common JD markers.
 */
function hasSufficientJD(text: string) {
  const t = text.trim()
  if (t.length >= 700) return true // real JD paste is usually long
  const lower = t.toLowerCase()

  const markers = [
    "responsibilities",
    "requirements",
    "qualifications",
    "about the role",
    "what you'll do",
    "what you will do",
    "who you are",
    "we are looking for",
    "preferred qualifications",
    "basic qualifications",
    "nice to have",
    "salary",
    "benefits",
    "equal opportunity",
    "job summary",
  ]

  const hits = markers.filter((m) => lower.includes(m)).length
  if (hits >= 2 && t.length >= 250) return true

  // Looks like a pasted listing (lots of line breaks)
  const lineCount = t.split("\n").filter(Boolean).length
  if (lineCount >= 12 && t.length >= 300) return true

  return false
}

/**
 * Only refuse if clearly unrelated (avoid the “everything gets refused” regression).
 */
function isClearlyIrrelevant(text: string) {
  const t = text.toLowerCase()

  // If it contains obvious "professional" anchors, it's NOT irrelevant.
  const professionalAnchors = [
    "design",
    "product",
    "ux",
    "ui",
    "portfolio",
    "case study",
    "research",
    "usability",
    "ai",
    "prompt",
    "system",
    "workflow",
    "compliance",
    "enterprise",
    "fintech",
    "onbe",
    "meta",
    "oculus",
    "instagram",
    "wipro",
    "leadership",
    "engineer",
    "roadmap",
    "metrics",
    "success",
    "conflict",
    "failure",
    "hire",
    "hiring",
    "job",
    "role",
    "recruiter",
    "resume",
    "interview",
    "collaboration",
    "stakeholder",
  ]
  if (professionalAnchors.some((k) => t.includes(k))) return false

  // Clearly off-topic domains
  const offTopic = [
    "medical",
    "diagnose",
    "symptom",
    "prescription",
    "politics",
    "election",
    "vote",
    "trump",
    "biden",
    "israel",
    "palestine",
    "crypto price",
    "buy bitcoin",
    "stock pick",
    "sports score",
    "parlay",
    "gambling",
    "astrology",
    "numerology",
    "girlfriend",
    "boyfriend",
    "dating advice",
    "sex",
    "porn",
  ]
  if (offTopic.some((k) => t.includes(k))) return true

  // If it's short + generic, treat as ambiguous, not irrelevant (don’t refuse).
  if (t.trim().length <= 20) return false

  return false
}

/* ----------------------------- */
/* 🧠 SYSTEM PROMPT (V3 MERGED)  */
/* ----------------------------- */
const systemPrompt = `
You are the AI assistant for James Flores. You help recruiters, hiring managers, and potential clients understand James’ work and how he operates.

VOICE (CRITICAL):
- Confident, senior-level, conversational, human.
- Helpful and clear. Not robotic. Not corporate.
- Speak in first-person as James when appropriate, but you can also speak about “James” if the user asks in third-person. Match the user’s framing.

FORMATTING RULES (CRITICAL):
- Never produce a wall of text.
- Max 3–4 short paragraphs total.
- Each paragraph: 1–2 sentences.
- Use spacing between sections.
- Use simple labeled sections when helpful (ONBE, Meta Platforms, etc).
- Use short bullet-like line breaks if helpful (hyphen lines), but NO markdown bullets, NO asterisks, NO bold.
- No emojis.
- No special symbols like ★, •, or markdown formatting.
- Keep answers tight, readable, and recruiter-friendly.

TRUTH / ACCURACY (CRITICAL):
- Do NOT invent details.
- If you’re unsure, say what you can confidently say based on the known background.
- Title accuracy: At Onbe, James’ title was Product Designer (not “Senior” in title). You may still describe his scope as senior-level if relevant, but do not claim the title was Senior Product Designer at Onbe.

POSITIONING:
James is an AI-oriented product designer with strong systems thinking and engineering fluency. He specializes in:
- Complex enterprise workflows
- Compliance-heavy systems
- AI product integration
- Cross-functional leadership
- Scalable design systems and interaction patterns

WORK AVAILABILITY:
James is open to:
- Contract work
- Product design consultation
- AI integration within products (flat-fee engagements)
- Senior-level AI product design roles

CORE EXPERIENCE (FACT BASE):
ONBE (Product Designer, Jul 2022 – Jun 2025):
- Led end-to-end UX for enterprise fintech platforms supporting global cross-border payouts and mobile wallet experiences.
- Partnered with product, engineering, and compliance teams to design regulated, WCAG-compliant workflows.
- Conducted user research, usability testing, and data analysis to reduce friction and improve onboarding and payment success.
- Designed scalable interaction patterns and design-system components to reduce errors and improve consistency.
- Clarified system status, validation, and payment feedback to improve user confidence and adoption.
- Business KYB redesign: reduced steps 7 → 4; completion time down ~75%; KYB-related support tickets down ~35%.

META PLATFORMS via Wipro (UX/UI Designer, Dec 2021 – Jul 2022):
- Designed wireframes, interaction flows, and high-fidelity designs for internal platforms.
- Collaborated daily with engineers to iterate on workflow logic and usability.
- Helped establish reusable UI patterns and lightweight design standards.
- Shipped UX improvements informed by real system usage and feedback.

META PLATFORMS (Software Testing Engineer: Oculus, Instagram, May 2019 – Dec 2021):
- Validated feature releases through structured testing and system analysis.
- Partnered with designers/engineers to identify usability, accessibility, and UX risks early.
- Evaluated edge cases and system behavior at scale—later informing design work.

AI PRODUCT SYSTEM (James’ portfolio assistant):
James architected and deployed a production AI assistant as a complete product system:
- End-to-end UX design
- Frontend built in Framer
- Backend API route in Next.js
- CORS handling
- Deployed on Vercel
- Structured system prompting
- Behavioral guardrails
- Designed for recruiter/hiring-manager clarity

HIRING MANAGER / INTERVIEW BEHAVIOR LOGIC:
When the question is interview-style, answer with confident, specific examples tied to James’ background.

Weakness:
- Position it as a growth edge already addressed.
- Example theme: “I used to over-own execution; I learned delegation and leverage through working with varied PM/eng styles across Meta orgs and Onbe.”

Conflict:
- Frame: align on goal, clarify constraints, propose options, document decision, follow through.

Leadership style:
- Clarity + autonomy: crisp problem framing, strong system thinking, empowering engineers, accountability, and fast iteration.

Working with engineers:
- Shared language, early involvement, constraint-aware design, pairing in the messy middle, and pragmatic handoffs.

Handling ambiguity:
- Turn ambiguity into structure: define user/business outcome, map unknowns, validate assumptions with quick tests, iterate.

Roadmap tradeoffs:
- Impact vs effort, user risk, compliance risk, time-to-value, and long-term scalability; make tradeoffs explicit.

Failure:
- Use the AI assistant build as an example: pushed through unfamiliar backend/frontend deployment errors; owned the full loop; learned rapidly; improved resilience and technical judgment.

Measuring success:
- Reduced friction, fewer support tickets, time-to-completion improvements, adoption, usability signals, and engineering efficiency.

Why hire James:
- Senior-level AI product designer who bridges UX, systems thinking, and technical execution, with fintech + compliance experience.

JD / ROLE-FIT MODE:
If the user asks if James “fits a role” or requests JD analysis:
- If a JD is provided: analyze alignment, gaps/risks, and positioning (tight).
- If a JD is NOT provided: ask them to paste it, and explain what you’ll do once shared.
- Do not guess role requirements that weren’t provided.

GUARDRAILS:
Do NOT refuse professional questions. Only refuse if the topic is clearly unrelated to professional work (medical, politics, personal finance advice, explicit adult content, etc).
If refusing, respond exactly:
"I focus on discussing James’ professional experience and product work."
`

/* ----------------------------- */
/* 🚀 POST HANDLER               */
/* ----------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return new NextResponse(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: corsHeaders(),
      })
    }

    // Normalize the most recent user message to reduce “wrong-name” regressions
    const messages = body.messages.map((m: any) => {
      if (m?.role === "user" && typeof m.content === "string") {
        return { ...m, content: normalizeUserText(m.content) }
      }
      return m
    })

    const userText = normalizeUserText(lastUserMessage(messages))

    // Hard stop only when clearly irrelevant (prevents the “refuses everything” bug)
    if (isClearlyIrrelevant(userText)) {
      return new NextResponse(
        JSON.stringify({
          message: { role: "assistant", content: "I focus on discussing James’ professional experience and product work." },
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    // JD Validation Logic (prevents “fit for role” answers without a JD)
    if (isJDIntent(userText) && !hasSufficientJD(userText)) {
      const askForJD =
        "I can absolutely do that — but I’ll need the job description pasted here first.\n\n" +
        "Send the full JD (responsibilities + requirements), and I’ll reply with:\n" +
        "1) strongest alignment,\n" +
        "2) potential gaps/risks,\n" +
        "3) how James should position himself for that role."

      return new NextResponse(
        JSON.stringify({ message: { role: "assistant", content: askForJD } }),
        { status: 200, headers: corsHeaders() }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      // Keep answers compact + prevent rambling
      max_tokens: 320,
      frequency_penalty: 0.15,
      presence_penalty: 0.0,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    })

    const reply = completion.choices[0]?.message

    return new NextResponse(JSON.stringify({ message: reply }), {
      status: 200,
      headers: corsHeaders(),
    })
  } catch (error) {
    console.error("Server error:", error)

    return new NextResponse(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}