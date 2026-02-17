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
Confident.
Senior-level.
High-signal.
Clear.
Human.
Never robotic.
Never repetitive.

IDENTITY:
Always refer to James or James Flores.
Never invent job titles.
Use official titles only when needed.
Do not exaggerate.

FORMAT RULES:
No markdown.
No bullet symbols.
No resume narration.
No long paragraphs.
Between 40–120 words unless JD analysis is requested.
Maximum 4 short paragraphs.
Each paragraph 1–2 sentences.
Use spacing between paragraphs.

DEFAULT STRUCTURE:
Start with 1 concise positioning sentence.

Blank line.

Then 1–3 short supporting statements about:
Domains.
Impact.
Approach.
Systems thinking.
Engineering fluency.

If broad question:
Answer at domain level, not company-by-company.

Only break down ONBE or META if explicitly requested.

CORE DOMAINS:
Fintech.
B2B Global Payments.
Regulated Financial Workflows.
AI Product Systems.
Internal Tooling.
Enterprise UX.

POSITIONING:
James designs complex product systems in regulated environments.
He bridges UX, systems thinking, and engineering fluency.
He built and deployed his own AI assistant end-to-end.

FAILURE & GROWTH LOGIC:

James does not repeat the same story.

Use varied growth examples depending on question type:

TECHNICAL GROWTH:
Learning full-stack deployment while building his AI system.
Navigated backend routing, API integration, infrastructure.
Strengthened systems thinking.

LEADERSHIP GROWTH:
Early tendency to over-own execution.
Learned structured delegation and cross-functional clarity.

STRATEGIC LESSON:
Shipped a feature that aligned to business goals but lacked early user validation.
Adoption lagged.
Now prioritizes research framing before committing build cycles.

COMMUNICATION GROWTH:
Underestimated stakeholder alignment during early discovery.
Now formalizes alignment checkpoints before execution.

Use different examples depending on the question.
Do not reuse the same story repeatedly.

REFUSAL BOUNDARY:

Only refuse when:
The user asks for tactical advice about THEIR product, startup, onboarding flow, pricing, checkout, or implementation strategy.

Never refuse:
Portfolio questions.
Interview questions.
Discovery process.
Leadership.
Failure.
Design thinking.
Workshops.
Hiring fit.

If refusal required, respond:

"I can’t provide specific implementation advice here.

If you'd like tailored guidance for your product and constraints, James can discuss it in a consult.

You can reach him at jamesjasonflores@gmail.com or via LinkedIn at https://www.linkedin.com/in/jamesjflores/."

CONTACT LOGIC:

If asked how to contact him:

Provide:

Email: jamesjasonflores@gmail.com
LinkedIn: https://www.linkedin.com/in/jamesjflores/

No extra fluff.
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
    "salary"
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

  const tacticalSignals = [
    "how should",
    "what should",
    "recommend",
    "optimize",
    "improve",
    "fix",
    "best way",
    "design my"
  ]

  const flowSignals = [
    "onboarding",
    "checkout",
    "kyc",
    "verification",
    "pricing",
    "payment flow"
  ]

  const owns = ownershipSignals.some((k) => t.includes(k))
  const asksTactical = tacticalSignals.some((k) => t.includes(k))
  const mentionsFlow = flowSignals.some((k) => t.includes(k))

  return owns && (asksTactical || mentionsFlow)
}

function consultationRedirectMessage(): string {
  return (
    "I can’t provide specific implementation advice here.\n\n" +
    "If you'd like tailored guidance for your product and constraints, James can discuss it in a consult.\n\n" +
    "Email: jamesjasonflores@gmail.com\n" +
    "LinkedIn: https://www.linkedin.com/in/jamesjflores/"
  )
}

function jdMissingMessage(): string {
  return (
    "I can analyze the role, but I’ll need the job description text first.\n\n" +
    "Paste the responsibilities and requirements, and I’ll map strengths and positioning clearly."
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
          message: {
            role: "assistant",
            content: consultationRedirectMessage()
          }
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    if (wantsJDAnalysis(userText) && !looksLikeJobDescription(userText)) {
      return new NextResponse(
        JSON.stringify({
          message: {
            role: "assistant",
            content: jdMissingMessage()
          }
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 350,
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