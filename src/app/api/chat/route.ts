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
/* 🧠 SYSTEM PROMPT              */
/* ----------------------------- */
const systemPrompt = `
You are the portfolio AI assistant for James Flores.

VOICE:
- Confident, senior-level, conversational, human.
- Clear and recruiter / hiring-manager friendly.
- Never robotic. Never overly corporate.

IDENTITY & ACCURACY (CRITICAL):
- Always refer to "James" or "James Flores" (not other names).
- If the user misspells James’ name or uses another name, gently correct once (“You mean James Flores?”) and proceed.
- Do NOT invent job titles. Use official titles:
  - Product Designer — Onbe (July 2022 – June 2025)
  - UX/UI Designer — Meta Platforms (via Wipro) (Dec 2021 – Jul 2022)
  - Software Testing Engineer — Meta Platforms (Oculus, Instagram) (May 2019 – Dec 2021)
- You may describe the scope as “senior-level” based on impact, but do not claim “Senior Product Designer” as a formal title unless asked about level (then clarify scope vs title).

RESPONSE FORMAT RULES (HARD REQUIREMENTS):
- No markdown formatting.
- No asterisks. No bullets using "-".
- No long walls of text.
- Default length: 4–7 sentences total.
- Use blank lines between sections.
- When listing experience, use this exact structure:

One-sentence summary.

ONBE
1–2 sentences.

META PLATFORMS
1–2 sentences.

(Only include sections relevant to the question.)

If the user asks an interview-style question, answer in:
1 short paragraph (2–3 sentences),
then an optional “Example” line (1 sentence).

If the user asks for a JD analysis AND they pasted a JD:
- Output:
  1 sentence overview
  3 “Strong matches” lines (each 1 sentence)
  2 “Potential gaps” lines (each 1 sentence)
  1 “How James would de-risk” line (1 sentence)
- Keep it compact and concrete.

POSITIONING (Hiring-manager ready):
James is a product designer who bridges UX, systems thinking, and engineering fluency. He excels in complex, regulated workflows and building scalable, high-signal product experiences.

CORE EXPERIENCE (Grounded):
ONBE (Product Designer):
- Led end-to-end UX for enterprise fintech platforms supporting global cross-border payouts and mobile wallet experiences.
- Designed WCAG-compliant, regulated financial workflows with product, engineering, and compliance.
- Ran research + usability testing + data analysis to reduce friction and improve onboarding/payment success.
- Built scalable interaction patterns + design-system components to reduce errors and improve consistency.

Meta Platforms (UX/UI Designer via Wipro):
- Designed wireframes, flows, and high-fidelity UI for internal platforms.
- Partnered daily with engineers; contributed reusable patterns + lightweight standards.

Meta Platforms (Software Testing Engineer — Oculus, Instagram):
- Validated feature releases; identified usability, accessibility, and UX risks early.
- Built deep system-level understanding of product logic, constraints, and scale.

AI PRODUCT SYSTEM (James’ portfolio assistant):
- Designed the UX end-to-end in Framer.
- Built backend API routes in Next.js, implemented CORS, deployed on Vercel.
- Engineered structured system prompts + behavioral guardrails.
- Approaches AI as product infrastructure (safety + reliability + experience), not a gimmick.

AVAILABILITY:
James is open to:
- Contract work
- Product consultation
- AI integration in products (flat-fee engagements)
- Senior-level AI-oriented product design roles

INTERVIEW ANSWER LOGIC:
- Weakness: show growth already addressed (e.g., learned to delegate and align across PM styles; now uses clear ownership + decision frameworks).
- Conflict: structured communication, clarify constraints, align on goal, document decision, move forward.
- Leadership style: clarity, systems thinking, empower engineers, accountability, unblock fast, raise quality bar.
- Measuring success: reduced friction, completion time, support tickets, adoption, error rate, engineering efficiency.
- Ambiguity: frame problem, define success, test assumptions, iterate with tight feedback loops.
- Engineers: involve early, speak constraints, co-design with feasibility, reduce rework.
- Roadmap tradeoffs: impact vs effort, user risk, compliance risk, scalability, opportunity cost.
- Failure: building/deploying the AI system—pushed through unknowns, debugged, iterated, shipped; learned repeatable delivery system.

SAFETY / CONSULTATION BOUNDARY (CRITICAL):
Do NOT give product/UX “how-to” advice for the user’s product, startup, or flows (KYC, onboarding, checkout, pricing, etc).
Instead:
- Briefly say you can’t provide specific product advice here.
- Offer a consultation with James and invite contact.
- If helpful, ask them to share the context directly with James.

If asked for finance, politics, medical, legal, or other unrelated topics:
"I focus on discussing James’ professional experience and product work."

CONTACT INVITE (use when appropriate, not every message):
If a user asks for advice, consulting, or hiring:
"Want to discuss this with James? Reach him via the contact section on jamesjasonflores.com."
`

/* ----------------------------- */
/* 🧩 Helpers                    */
/* ----------------------------- */
function lastUserText(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user" && typeof messages[i]?.content === "string") {
      return messages[i].content
    }
  }
  return ""
}

function looksLikeJobDescription(text: string): boolean {
  const t = text.toLowerCase()
  const jdSignals = [
    "responsibilities",
    "requirements",
    "qualifications",
    "what you'll do",
    "what you will do",
    "about the role",
    "job description",
    "we are looking for",
    "preferred",
    "nice to have",
    "years of experience",
    "compensation",
    "salary",
    "benefits",
  ]
  const hit = jdSignals.some((k) => t.includes(k))
  return hit || text.length > 900 // long paste often indicates JD
}

function wantsJDAnalysis(text: string): boolean {
  const t = text.toLowerCase()
  return (
    t.includes("jd") ||
    t.includes("job description") ||
    t.includes("analyze this role") ||
    t.includes("fit for this role") ||
    t.includes("how would he fit") ||
    t.includes("how does he fit") ||
    t.includes("align with this role") ||
    t.includes("match this job") ||
    t.includes("tailor to this role")
  )
}

function isProductAdviceRequest(text: string): boolean {
  const t = text.toLowerCase()

  // Direct user-product signals
  const ownershipSignals = ["my product", "my startup", "our product", "our startup", "my app", "our app", "my flow", "our flow", "we are building", "i'm building"]

  // Advice verbs + flow keywords
  const adviceVerbs = ["how should", "what should", "can you advise", "recommend", "best way", "best practice", "design a", "improve", "optimize", "fix", "approach"]
  const flowKeywords = ["kyc", "onboarding", "signup", "sign up", "checkout", "payment flow", "payout", "compliance flow", "verification", "identity", "wallet flow", "pricing", "funnel"]

  const owns = ownershipSignals.some((k) => t.includes(k))
  const asksAdvice = adviceVerbs.some((k) => t.includes(k))
  const mentionsFlow = flowKeywords.some((k) => t.includes(k))

  // Conservative: any “how-to” about flows triggers redirect (even if not “my”)
  return (asksAdvice && mentionsFlow) || (owns && (asksAdvice || mentionsFlow))
}

function consultationRedirectMessage(): string {
  return (
    "I can’t provide specific product-flow advice here.\n\n" +
    "If you want guidance on a KYC/onboarding/payment flow, James can cover it in a consult so the recommendations match your users, constraints, and compliance requirements.\n\n" +
    "Want to discuss this with James? Reach him via the contact section on jamesjasonflores.com."
  )
}

function jdMissingMessage(): string {
  return (
    "I can do that, but I’ll need the job description text first.\n\n" +
    "Paste the JD (responsibilities + requirements), and I’ll quickly map what matches, what’s missing, and how James would position it for a hiring manager."
  )
}

/**
 * Normalize model output so it stays readable in your UI:
 * - Remove markdown tokens
 * - Convert common bullet styles into sectioned spacing
 * - Ensure blank lines between headings
 */
function normalizeAssistantText(raw: string): string {
  if (!raw) return ""

  let text = raw

  // Strip common markdown artifacts
  text = text.replace(/```[\s\S]*?```/g, "") // code fences
  text = text.replace(/[*_`>#]/g, "") // markdown tokens
  text = text.replace(/\r\n/g, "\n")

  // Convert hyphen bullets into line breaks (but remove the hyphen)
  text = text.replace(/\n-\s+/g, "\n")
  text = text.replace(/(^|\n)-\s+/g, "$1")

  // Convert “SECTION:” into section headings
  text = text.replace(/\b(ONBE|META PLATFORMS|META|ONBE NATIVE MOBILE APP|SPECIAL OLYMPICS OF TEXAS|AI PRODUCT SYSTEM|AI SYSTEM)\s*:\s*/gi, "\n\n$1\n")

  // Force spacing after sentence endings when it looks compressed
  text = text.replace(/([a-z0-9])\.\s+([A-Z])/g, "$1.\n\n$2")

  // Collapse excessive blank lines
  text = text.replace(/\n{3,}/g, "\n\n").trim()

  // Guarantee a clean section layout if model forgot spacing
  // (light touch: only if headings exist)
  const headings = ["ONBE", "META PLATFORMS", "ONBE NATIVE MOBILE APP", "SPECIAL OLYMPICS OF TEXAS", "AI PRODUCT SYSTEM", "AI SYSTEM"]
  for (const h of headings) {
    const re = new RegExp(`\\n${h}\\n(?!\\n)`, "g")
    text = text.replace(re, `\n${h}\n`)
  }

  return text
}

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

    const userText = lastUserText(body.messages)

    // 1) Product advice boundary (legal/safety)
    if (isProductAdviceRequest(userText)) {
      return new NextResponse(
        JSON.stringify({ message: { role: "assistant", content: consultationRedirectMessage() } }),
        { status: 200, headers: corsHeaders() }
      )
    }

    // 2) JD validation logic (if they want JD analysis but didn’t paste JD)
    if (wantsJDAnalysis(userText) && !looksLikeJobDescription(userText)) {
      return new NextResponse(
        JSON.stringify({ message: { role: "assistant", content: jdMissingMessage() } }),
        { status: 200, headers: corsHeaders() }
      )
    }

    // 3) Normal assistant response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 420,
      messages: [{ role: "system", content: systemPrompt }, ...body.messages],
    })

    const reply = completion.choices[0]?.message
    const normalized = normalizeAssistantText(reply?.content || "")

    return new NextResponse(
      JSON.stringify({
        message: {
          role: "assistant",
          content: normalized,
        },
      }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    )
  } catch (error) {
    console.error("Server error:", error)

    return new NextResponse(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}