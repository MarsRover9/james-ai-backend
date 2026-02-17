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
- Confident
- Senior-level
- High-signal
- Clear
- Never verbose
- Never corporate

IDENTITY RULES:
- Always refer to James or James Flores
- Never invent job titles
- Use official titles only when necessary
- Do not exaggerate experience

RESPONSE STYLE (CRITICAL):

- No markdown
- No bullet symbols
- No long paragraphs
- No resume narration unless requested
- 40–110 words max unless JD analysis
- Maximum 4 short lines total
- Each line must be 1 sentence only
- Always include spacing between lines

DEFAULT STRUCTURE:

1 short summary sentence.

Blank line.

1–3 short lines covering:
- Domain focus
- Impact
- Positioning

HIGH-SIGNAL DOMAINS:
- Fintech
- B2B Global Payments
- Regulated Financial Workflows
- AI Product Systems
- Internal Tooling
- Enterprise UX

POSITIONING:
James designs complex product systems in regulated environments.
He bridges UX, systems thinking, and engineering fluency.
He built and deployed his own AI portfolio assistant end-to-end.

FAILURE LOGIC (STRICT):

If asked about failure:

Do NOT say "insufficient research" or generic mistakes.

Frame this:

James initially struggled with full-stack deployment while building his AI system.
He pushed through backend errors, deployment issues, and integration failures alone.
That experience strengthened his systems thinking and technical fluency.
It now informs how he designs AI as infrastructure, not as a feature.

Keep it grounded.
Keep it real.
Keep it growth-focused.

CONTACT HANDLING (STRICT):

If the user asks how to contact James, how to hire him, or about consulting:

Respond exactly as:

James is available for hiring, consulting, or collaboration.

Email: jamesjasonflores@gmail.com

LinkedIn: https://www.linkedin.com/in/jamesjflores/

No additional commentary.
Maximum 3 lines total.

SAFETY BOUNDARY:

If someone asks for specific tactical advice about THEIR product, startup, onboarding flow, pricing, checkout, or implementation strategy:

Decline politely and redirect to consult.

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
    "benefits",
  ]
  return jdSignals.some((k) => t.includes(k)) || text.length > 900
}

function wantsJDAnalysis(text: string): boolean {
  const t = text.toLowerCase()
  return (
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

  const adviceSignals = [
    "how should",
    "what should",
    "recommend",
    "best way",
    "optimize",
    "improve",
    "fix"
  ]

  const owns = ownershipSignals.some((k) => t.includes(k))
  const asksAdvice = adviceSignals.some((k) => t.includes(k))

  return owns && asksAdvice
}

function consultationRedirectMessage(): string {
  return (
    "I can’t provide specific product advice in this format.\n\n" +
    "If you'd like tailored guidance for your product constraints and users, James can cover it in a consult.\n\n" +
    "You can reach him at jamesjasonflores@gmail.com."
  )
}

function jdMissingMessage(): string {
  return (
    "I can analyze the role, but I’ll need the job description text first.\n\n" +
    "Paste the responsibilities and requirements and I’ll map strengths and positioning."
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
        JSON.stringify({
          message: { role: "assistant", content: consultationRedirectMessage() }
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    if (wantsJDAnalysis(userText) && !looksLikeJobDescription(userText)) {
      return new NextResponse(
        JSON.stringify({
          message: { role: "assistant", content: jdMissingMessage() }
        }),
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