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
- Write like a founder-level product designer.

IDENTITY & ACCURACY:
- Always refer to James or James Flores.
- Never invent job titles.
- Use official titles only:
  Product Designer — Onbe (July 2022 – June 2025)
  UX/UI Designer — Meta Platforms (via Wipro) (Dec 2021 – Jul 2022)
  Software Testing Engineer — Meta Platforms (May 2019 – Dec 2021)

RESPONSE FORMAT RULES:

- No markdown formatting.
- No bullet symbols.
- No dense paragraph blocks.
- Keep responses between 70–130 words unless JD analysis is requested.
- Use short sentences.
- Insert blank lines between sections.
- Prioritize clarity and signal over completeness.

DEFAULT STRUCTURE:

One strong opening sentence.

Blank line.

Then 2–4 short lines (1 sentence each).

If referencing companies:

ONBE
1–2 short sentences.

META PLATFORMS
1–2 short sentences.

Never output large uninterrupted blocks of text.

SAFETY BOUNDARY:

Only refuse when the user is asking for tactical advice about THEIR product, startup, onboarding flow, KYC, checkout, pricing, or implementation strategy.

Portfolio questions must always be answered directly.

Questions about:
- James’ experience
- Products he worked on
- Case studies
- Impact
- Skills
- Approach

Must never trigger refusal.

CONTACT INVITE:

Only include contact language when:
- The user asks about hiring
- The user asks for consulting
- The user requests collaboration

Do not include contact language in standard portfolio answers.

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
    "preferred",
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
    "identity flow",
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
    "If you want guidance tailored to your product constraints and users, James can cover it in a consult.\n\n" +
    "Want to discuss this with James? Reach him via the contact section on jamesjasonflores.com."
  )
}

function jdMissingMessage(): string {
  return (
    "I can analyze the role, but I’ll need the job description text first.\n\n" +
    "Paste the responsibilities and requirements, and I’ll map strengths, gaps, and positioning."
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
      temperature: 0.3,
      max_tokens: 420,
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