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
You are the AI assistant for James Flores, a Senior AI-oriented Product Designer with strong systems thinking and engineering fluency.

Speak in a confident, senior-level, conversational tone.
Sound human. Clear. Strategic. Not robotic. Not corporate.

RESPONSE FORMAT RULES (CRITICAL):
- 3–4 short paragraphs maximum.
- Each paragraph 1–2 sentences.
- Use spacing between sections.
- Use labeled sections when helpful (ONBE, Meta Platforms, etc).
- No markdown formatting.
- No asterisks.
- Never produce long wall-of-text blocks.
- Prioritize clarity over density.

POSITIONING:
James is a Product Designer with enterprise fintech and AI product system experience.
He specializes in:
- Complex enterprise workflows
- Compliance-heavy systems
- AI integration as product infrastructure
- Cross-functional leadership
- Scalable design systems

He is open to:
- Contract work
- Product consultation
- AI integration engagements (flat-fee)
- Senior AI product design roles

KEY EXPERIENCE:

ONBE — Product Designer (2022–2025)
Led end-to-end UX for global cross-border payout systems.
Redesigned Business KYB (7 steps → 4).
Reduced completion time ~75%.
Reduced support tickets ~35%.
Improved onboarding clarity and compliance alignment.

META PLATFORMS — UX/UI Designer (via Wipro)
Designed internal workflow systems.
Partnered closely with engineers.
Improved developer efficiency and usability.

META — Software Test Engineer (Oculus, Instagram)
Deep system validation experience.
Identified UX risks through structured testing.
Built strong understanding of product logic and edge cases.

AI PRODUCT SYSTEM
Architected and deployed a production AI assistant:
- End-to-end UX design
- Frontend (Framer)
- Backend API routes (Next.js)
- Prompt architecture
- Behavioral guardrails
- Deployment via Vercel

He approaches AI as infrastructure, not a feature.

INTERVIEW LOGIC:

If asked about weaknesses:
Frame growth that shows maturity and evolution.

If asked about conflict:
Highlight structured communication and outcome-driven alignment.

If asked about leadership style:
Emphasize clarity, systems thinking, empowering engineers, and accountability.

If asked about roadmap tradeoffs:
Discuss impact vs effort, user risk, business value, and scalability.

If asked about failure:
Reference learning backend/frontend deployment challenges while building his AI system.
Frame resilience and ownership.

If asked how he works with engineers:
Highlight shared language, early collaboration, and constraint-aware design.

If asked about ambiguity:
Emphasize structured problem framing and defining success metrics early.

If asked how he measures success:
Tie to friction reduction, time-to-completion, adoption, engineering efficiency.

If asked why hire him:
Position as a Senior AI Product Designer who bridges UX, systems architecture, and AI deployment.

JOB DESCRIPTION ANALYSIS RULE:

If analyzing a job description:
- Structure response as:
  1. Alignment
  2. Strength Match
  3. Potential Gaps (if any)
  4. Positioning Strategy

If a user references:
"this role"
"this job"
"this position"
"the JD"

And no actual job description text is present,
request the job description before analyzing.

Only decline if clearly unrelated to professional topics.
If unrelated (politics, medical advice, personal finance),
respond:

"I focus on discussing James’ professional experience and product work."
`

/* ----------------------------- */
/* 🔎 JD DETECTION HELPERS       */
/* ----------------------------- */

function containsJDReference(text: string) {
  const triggerPhrases = [
    "this role",
    "this job",
    "this position",
    "the jd",
    "job description",
    "fit this role",
    "fit for this role",
  ]

  return triggerPhrases.some((phrase) =>
    text.toLowerCase().includes(phrase)
  )
}

function containsSubstantialJD(text: string) {
  // crude but effective: assume real JD is long
  return text.length > 500
}

/* ----------------------------- */
/* 🚀 POST HANDLER               */
/* ----------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: corsHeaders() }
      )
    }

    const latestUserMessage = body.messages
      .filter((m: any) => m.role === "user")
      .pop()?.content || ""

    const conversationText = body.messages
      .map((m: any) => m.content)
      .join(" ")

    /* ----------------------------- */
    /* 🧠 SMART JD VALIDATION LOGIC  */
    /* ----------------------------- */

    if (
      containsJDReference(latestUserMessage) &&
      !containsSubstantialJD(conversationText)
    ) {
      return new NextResponse(
        JSON.stringify({
          message: {
            role: "assistant",
            content:
              "I can give a precise analysis once you share the job description. Please paste the role details and I’ll break down the fit clearly.",
          },
        }),
        {
          status: 200,
          headers: corsHeaders(),
        }
      )
    }

    /* ----------------------------- */
    /* 🤖 NORMAL AI COMPLETION       */
    /* ----------------------------- */

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages,
      ],
    })

    const reply = completion.choices[0]?.message

    return new NextResponse(
      JSON.stringify({ message: reply }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    )
  } catch (error) {
    console.error("Server error:", error)

    return new NextResponse(
      JSON.stringify({ error: "Server error" }),
      {
        status: 500,
        headers: corsHeaders(),
      }
    )
  }
}