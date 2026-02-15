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

function normalizeUserText(raw: string) {
  if (!raw) return raw
  let t = raw.trim()

  // Normalize whitespace
  t = t
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")

  // Normalize common name misspellings / wrong-name inputs
  t = t.replace(/\bJada\b/gi, "James")
  t = t.replace(/\bJame\b/gi, "James")
  t = t.replace(/\bJaems\b/gi, "James")
  t = t.replace(/\bJams\b/gi, "James")
  t = t.replace(/\bJame\s+Flores\b/gi, "James Flores")
  t = t.replace(/\bJames\s+Flore?s\b/gi, "James Flores")
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
    t.includes(" jd") ||
    t.includes("jd:") ||
    t.includes("role fit") ||
    t.includes("fit into this role") ||
    t.includes("fit for this role") ||
    t.includes("match this role") ||
    t.includes("tailor") ||
    t.includes("ats") ||
    t.includes("requirements") ||
    t.includes("qualifications") ||
    t.includes("how would he fit") ||
    t.includes("how would james fit") ||
    t.includes("positioning for this role")
  )
}

/**
 * Heuristic: does the user actually provide a JD block?
 */
function hasSufficientJD(text: string) {
  const t = text.trim()
  if (t.length >= 700) return true

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

  const lineCount = t.split("\n").filter(Boolean).length
  if (lineCount >= 12 && t.length >= 300) return true

  return false
}

/**
 * Only refuse if clearly unrelated (avoid over-refusal regression).
 */
function isClearlyIrrelevant(text: string) {
  const t = text.toLowerCase()

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

  const offTopic = [
    "medical",
    "diagnose",
    "symptom",
    "prescription",
    "politics",
    "election",
    "vote",
    "crypto price",
    "buy bitcoin",
    "stock pick",
    "parlay",
    "gambling",
    "sex",
    "porn",
  ]
  if (offTopic.some((k) => t.includes(k))) return true

  return false
}

/* ----------------------------- */
/* 🛡 Consultation Boundary      */
/* ----------------------------- */

/**
 * Detect when a user is asking for advice for THEIR product/startup, which we want to
 * avoid turning into free step-by-step consulting.
 */
function isClientSpecificAdviceRequest(text: string) {
  const t = text.toLowerCase()

  const ownershipSignals = [
    "my product",
    "my startup",
    "my company",
    "my app",
    "my team",
    "our product",
    "our startup",
    "our company",
    "our app",
    "we are building",
    "we're building",
    "we are designing",
    "we're designing",
    "for my users",
    "for our users",
    "for our business",
    "for my business",
    "for my client",
    "for our client",
  ]

  const adviceSignals = [
    "can you design",
    "can you help design",
    "tell me how to",
    "step by step",
    "exact steps",
    "what should i do",
    "what do you recommend",
    "how should we",
    "how do we",
    "what is the best way",
    "give me a flow",
    "give me a framework",
    "how would you build",
    "how would you approach our",
    "audit our",
    "review our",
  ]

  const hasOwnership = ownershipSignals.some((p) => t.includes(p))
  const wantsAdvice = adviceSignals.some((p) => t.includes(p))

  return hasOwnership && wantsAdvice
}

/**
 * Also catch cases where they don't say "my startup" explicitly, but are asking for
 * detailed implementation guidance for a specific flow.
 */
function isPrescriptiveFlowAdvice(text: string) {
  const t = text.toLowerCase()
  const prescriptivePatterns = [
    "design a kyc flow",
    "design a kyb flow",
    "design a kyc/kyb flow",
    "implement a kyc flow",
    "implement a kyb flow",
    "write the exact flow",
    "exact screens",
    "exact steps",
    "what fields should we collect",
    "what provider should we use",
    "what is the best kyc vendor",
  ]
  return prescriptivePatterns.some((p) => t.includes(p))
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
- Use short bullet-like line breaks if helpful using hyphen lines only, but NO markdown bullets, NO asterisks, NO bold.
- No emojis.
- No special symbols like ★, •, or markdown formatting.
- Keep answers tight, readable, and recruiter-friendly.

TRUTH / ACCURACY (CRITICAL):
- Do NOT invent details.
- If unsure, say what you can confidently say based on the known background.
- Title accuracy: At Onbe, James’ title was Product Designer (not “Senior” in title). You may describe his scope as senior-level when relevant, but do not claim the title was Senior Product Designer at Onbe.

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
- Business KYB redesign: reduced steps 7 → 4; completion time down ~75%; support tickets down ~35%.

META PLATFORMS via Wipro (UX/UI Designer, Dec 2021 – Jul 2022):
- Designed wireframes, interaction flows, and high-fidelity designs for internal platforms.
- Collaborated daily with engineers to iterate on workflow logic and usability.
- Helped establish reusable UI patterns and lightweight design standards.

META PLATFORMS (Software Testing Engineer: Oculus, Instagram, May 2019 – Dec 2021):
- Validated feature releases through structured testing and system analysis.
- Identified usability, accessibility, and UX risks early.
- Built strong understanding of product logic, constraints, and scale.

AI PRODUCT SYSTEM:
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
- Position as a growth edge already addressed (ex: improved delegation and cross-functional leverage).

Conflict:
- Align on goal, clarify constraints, propose options, document decision, follow through.

Leadership style:
- Clarity + autonomy: crisp framing, systems thinking, empower engineers, accountability, fast iteration.

Working with engineers:
- Shared language, early involvement, constraint-aware design, pragmatic handoffs.

Handling ambiguity:
- Define outcome, map unknowns, validate assumptions quickly, iterate to clarity.

Roadmap tradeoffs:
- Impact vs effort, user risk, compliance risk, time-to-value, long-term scalability.

Failure:
- Use the AI assistant build as an example of pushing through unfamiliar backend/frontend deployment errors; owned the full loop; learned rapidly.

Measuring success:
- Reduced friction, fewer support tickets, time-to-completion, adoption, usability signals, engineering efficiency.

Why hire James:
- Senior-level AI product designer bridging UX, systems thinking, and technical execution, with fintech + compliance experience.

JD / ROLE-FIT MODE:
If the user asks if James “fits a role” or requests JD analysis:
- If a JD is provided: respond with:
  Alignment
  Strength match
  Potential gaps or risks
  Positioning strategy
- If a JD is NOT provided: ask them to paste it. Do not guess requirements.

CONSULTATION BOUNDARY (SAFETY + POSITIONING):
You may discuss how James has approached similar challenges in his past work, and you may share high-level principles.

However, if a user asks for specific, prescriptive advice for their own product, startup, or implementation (step-by-step, exact flow, exact fields, exact solution):
- Do NOT provide prescriptive guidance.
- Provide a short principles-based answer anchored in James’ experience (1–2 paragraphs).
- Then redirect: explain that detailed guidance depends on context and is best handled in a consultation with James.
- Invite them to contact James via the contact form on his website.

Never present responses as legal, financial, or regulatory advice.

GUARDRAILS:
Only refuse if the topic is clearly unrelated to professional work (medical, politics, personal finance advice, explicit adult content, etc).
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

    // Normalize user input messages (typos, name drift)
    const messages = body.messages.map((m: any) => {
      if (m?.role === "user" && typeof m.content === "string") {
        return { ...m, content: normalizeUserText(m.content) }
      }
      return m
    })

    const userText = normalizeUserText(lastUserMessage(messages))

    // Hard stop only when clearly irrelevant (prevents over-refusal regression)
    if (isClearlyIrrelevant(userText)) {
      return new NextResponse(
        JSON.stringify({
          message: {
            role: "assistant",
            content: "I focus on discussing James’ professional experience and product work.",
          },
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    // JD validation: prevent incorrect "fit" analysis without an actual JD pasted
    if (isJDIntent(userText) && !hasSufficientJD(userText)) {
      const askForJD =
        "I can absolutely do that — I’ll just need the job description pasted here first.\n\n" +
        "Share the responsibilities and requirements, and I’ll reply with:\n" +
        "- strongest alignment\n" +
        "- potential gaps or risks\n" +
        "- how James should position himself for the role"

      return new NextResponse(
        JSON.stringify({ message: { role: "assistant", content: askForJD } }),
        { status: 200, headers: corsHeaders() }
      )
    }

    // Consultation boundary: detect client-specific advice requests and steer safely
    const needsConsultBoundary =
      isClientSpecificAdviceRequest(userText) || isPrescriptiveFlowAdvice(userText)

    const boundarySystemNudge = needsConsultBoundary
      ? {
          role: "system",
          content:
            "Apply the CONSULTATION BOUNDARY. Provide only high-level principles anchored in James’ past experience, avoid prescriptive step-by-step advice, and end with a short invitation to contact James via the contact form on his website for a consultation.",
        }
      : null

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 340,
      frequency_penalty: 0.15,
      presence_penalty: 0.0,
      messages: [
        { role: "system", content: systemPrompt },
        ...(boundarySystemNudge ? [boundarySystemNudge] : []),
        ...messages,
      ],
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