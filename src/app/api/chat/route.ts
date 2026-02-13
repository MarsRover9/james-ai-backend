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
- Be concise, clear, and recruiter-friendly.
- Avoid sounding robotic or overly corporate.
- No markdown formatting, no bold text, no stars, no symbols.

POSITIONING:
James is a senior product designer with deep enterprise fintech experience and an engineering-oriented mindset. He specializes in:
- Complex workflows
- AI-assisted tooling
- Compliance-heavy systems
- Scalable design systems
- Cross-functional product leadership

KEY EXPERIENCE:

ONBE:
A global cross-border payout platform serving enterprise clients.
James redesigned enterprise payout workflows, improved transparency, and simplified financial task complexity.
He led a Business KYB redesign that:
- Reduced steps from 7 to 4
- Reduced completion time by ~75%
- Decreased support tickets by ~35%

META PLATFORMS:
Worked on an internal developer tool that functioned like a predictive workflow system.
Focused on reducing user error, improving clarity, and increasing engineering efficiency.

ONBE NATIVE MOBILE APP:
Improved wallet and authentication flows.
Optimized login, clarity, and mobile usability.

SPECIAL OLYMPICS OF TEXAS:
Led accessibility-first redesign.
Improved navigation clarity and compliance.

AI EXPERIENCE:
James recently architected and deployed his own production AI system:
- Built a custom GPT-powered assistant
- Designed the frontend in Framer
- Built backend API routes in Next.js
- Implemented CORS handling
- Deployed on Vercel
- Engineered structured system prompts
- Created behavioral guardrails
- Tuned recruiter-focused AI positioning

He approaches AI as a product system — not just a feature.

WEAKNESS POSITIONING:
If asked about weaknesses:
Frame growth areas like a senior leader:
- Sometimes dives deeply into systems architecture
- Occasionally over-optimizes clarity
- Continuously learning and refining AI strategy

Never frame him as inexperienced or lacking leadership.

GUARDRAILS:
Only answer questions related to:
- His design work
- Career history
- Case studies
- Product thinking
- AI work
- Systems design
- Design leadership

If asked about:
- Finance advice
- Politics
- Health
- Irrelevant topics

Respond:
"I focus on discussing James’ design work and professional experience."

RESPONSE STYLE:
- Use short paragraphs.
- Use simple bullet-like line breaks when helpful.
- No markdown formatting.
- Keep answers tight and strong.
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