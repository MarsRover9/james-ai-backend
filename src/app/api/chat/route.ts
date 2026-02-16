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
- Confident.
- Senior-level.
- High-signal.
- Clear and recruiter-friendly.
- Never verbose.
- Never narrative unless explicitly requested.

IDENTITY RULES:
- Always refer to James or James Flores.
- Never invent job titles.
- Use official titles only when needed.
- Do not exaggerate.

RESPONSE STYLE (CRITICAL):

- No markdown.
- No bullet symbols.
- No long paragraphs.
- No resume-style narration.
- No career storytelling unless asked.
- Keep answers between 40–100 words unless JD analysis is requested.
- Maximum 4 short lines total unless explicitly asked for detail.
- Each line should be 1 sentence only.

DEFAULT STRUCTURE:

Start with 1 concise summary sentence.

Blank line.

Then 1–3 short lines summarizing:
- Domains
- Impact
- Product categories
- Positioning

If the question is broad (e.g. "What has he worked on?"),
respond with domain-level summary instead of company-by-company breakdown.

Only provide ONBE / META breakdown if the user explicitly asks for detail.

HIGH-SIGNAL DOMAINS (grounded facts):
- Fintech
- B2B Global Payments
- Regulated Financial Workflows
- AI Product Systems
- Internal Tooling
- Enterprise UX

POSITIONING:
James designs complex product systems in regulated and emerging markets.
He bridges UX, systems thinking, and engineering fluency.
Most recently, he built and deployed his own AI portfolio assistant end-to-end.

SAFETY BOUNDARY:

Only refuse when the user asks for tactical advice about THEIR product, startup, onboarding flow, pricing, checkout, or implementation strategy.

Portfolio questions must always be answered directly.

CONTACT INVITE:

Only include contact language when:
- The user asks about hiring.
- The user asks about consulting.
- The user requests collaboration.

Never include contact language in normal portfolio answers.

If asked about unrelated topics:
"I focus on discussing James’ professional experience and product work."
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
    "about the role",
    "job description",
    "we are looking for",
    "years of experience",
    "salary",
    "benefits",
  ]
  return jdSignals.some((k) => t.includes(k)) || text.length > 900
}

function wantsJDAnalysis(text: string): boolean {
  const t = text.toLowerCase()
  return (
    t.includes("jd") ||
    t.includes("job description") ||
    t.includes("analyze this role") ||
    t.includes("fit for this role") ||
    t.includes("match this job")
  )
}

function isProductAdviceRequest(text: string): boolean {
  const t = text.toLowerCase()

  const ownershipSignals = [
    "my product",
    "my startup",
    "our product",
    "our startup",
    "my app",
    "our app",
    "we are building",
    "i'm building"
  ]

  const adviceVerbs = [
    "how should",
    "what should",
    "recommend",
    "best way",
    "optimize",
    "improve",
    "fix"
  ]

  const flowKeywords = [
    "kyc",
    "onboarding",
    "checkout",
    "pricing",
    "verification",
    "payment flow"
  ]

  const owns = ownershipSignals.some((k) => t.includes(k))
  const asksAdvice = adviceVerbs.some((k) => t.includes(k))
  const mentionsFlow = flowKeywords.some((k) => t.includes(k))

  return owns && (asksAdvice || mentionsFlow)
}

function consultationRedirectMessage(): string {
  return (
    "I can’t provide specific product-flow advice here.\n\n" +
    "If you want tailored guidance for your product constraints and users, James can cover it in a consult.\n\n" +
    "Reach him via the contact section on jamesjasonflores.com."
  )
}

function jdMissingMessage(): string {
  return (
    "I can analyze the role, but I’ll need the job description text first.\n\n" +
    "Paste the responsibilities and requirements, and I’ll map strengths and positioning."
  )
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

    const userText = lastUserText(body.messages)

    if (isProductAdviceRequest(userText)) {
      return new NextResponse(
        JSON.stringify({ message: { role: "assistant", content: consultationRedirectMessage() } }),
        { status: 200, headers: corsHeaders() }
      )
    }

    if (wantsJDAnalysis(userText) && !looksLikeJobDescription(userText)) {
      return new NextResponse(
        JSON.stringify({ message: { role: "assistant", content: jdMissingMessage() } }),
        { status: 200, headers: corsHeaders() }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.28,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages,
      ],
    })

    const reply = completion.choices[0]?.message?.content || ""

    return new NextResponse(
      JSON.stringify({
        message: {
          role: "assistant",
          content: reply.trim(),
        },
      }),
      { status: 200, headers: corsHeaders() }
    )
  } catch (error) {
    console.error("Server error:", error)

    return new NextResponse(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: corsHeaders() }
    )
  }
}