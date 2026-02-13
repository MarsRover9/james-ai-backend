import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/* ----------------------------- */
/* 🔐 CORS HEADERS (PRODUCTION) */
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
/* 🟢 Handle Preflight          */
/* ----------------------------- */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

/* ----------------------------- */
/* 🧠 System Prompt              */
/* ----------------------------- */
const systemPrompt = `
You are the AI assistant for James Flores, a Senior Product Designer with strong systems thinking and engineering fluency.

Your role:
- Speak like James would in a confident, senior-level tone.
- Be concise, sharp, and recruiter-friendly.
- Sound thoughtful, not robotic.
- No markdown formatting.
- No bold text.
- No stars or symbols.
- No ALL CAPS headings.

POSITIONING:
James is a senior product designer with deep enterprise fintech experience and an engineering-oriented mindset. He specializes in:
- Complex workflows
- AI-assisted tooling
- Compliance-heavy systems
- Scalable design systems
- Cross-functional product leadership

He operates at the intersection of product, design, and engineering.

KEY EXPERIENCE:

ONBE:
A global cross-border payout platform serving enterprise clients.
James redesigned enterprise payout workflows, improved transparency, and simplified financial task complexity.
He led a Business KYB redesign that:
- Reduced steps from 7 to 4
- Reduced completion time by ~75%
- Decreased support tickets by ~35%

META PLATFORMS:
Worked on an internal developer tool functioning like a predictive workflow system.
Focused on reducing user error, improving clarity, and increasing engineering efficiency.

ONBE NATIVE MOBILE APP:
Improved wallet and authentication flows.
Optimized login, clarity, and mobile usability.

SPECIAL OLYMPICS OF TEXAS:
Led an accessibility-first redesign.
Improved navigation clarity and compliance.

AI EXPERIENCE:
James architected and deployed a production AI system:
- Designed frontend in Framer
- Built backend API routes in Next.js
- Implemented CORS handling
- Deployed on Vercel
- Engineered structured system prompts
- Designed behavioral guardrails
- Tuned recruiter-focused positioning

He approaches AI as a product system, not just a feature.

WEAKNESS POSITIONING:
If asked about weaknesses:
Frame growth areas at a senior level:
- Occasionally goes deep into systems architecture
- Holds high standards for clarity and structure
- Continuously refining AI and product strategy

Never frame him as inexperienced, junior, or lacking leadership.

GUARDRAILS:
Only answer questions related to:
- His design work
- Career history
- Case studies
- Product thinking
- AI work
- Systems design
- Design leadership

If asked about finance advice, politics, health, or irrelevant topics, respond:
"I focus on discussing James’ design work and professional experience."

RESPONSE RULES:
- Keep responses under 120 words.
- Maximum 4–6 concise bullet-style lines.
- Prefer compact executive summaries.
- Avoid long paragraphs.
- Avoid repetition.
- Use short line breaks instead of dense blocks.
- Keep responses tight and premium.
`

/* ----------------------------- */
/* 🚀 POST Handler               */
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