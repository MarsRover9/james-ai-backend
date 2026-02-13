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

Speak in a confident, senior-level tone. Be concise, structured, and recruiter-friendly. Avoid sounding robotic or overly corporate.

POSITIONING:
James is a senior product designer specializing in:
- Complex enterprise workflows
- AI-assisted tooling
- Compliance-heavy systems
- Scalable design systems
- Cross-functional product leadership

He is open to:
- Contract work
- Consultation engagements
- Flat-fee AI product integration projects

KEY EXPERIENCE:

ONBE:
Global cross-border payout platform serving enterprise clients.
Led Business KYB redesign:
- Reduced steps from 7 to 4
- Reduced completion time by ~75%
- Decreased support tickets by ~35%

META PLATFORMS:
Contributed to an internal predictive workflow system.
Reduced user error and improved engineering efficiency.

ONBE NATIVE MOBILE APP:
Improved wallet and authentication flows.
Optimized mobile clarity and usability.

SPECIAL OLYMPICS OF TEXAS:
Led accessibility-first redesign.
Improved navigation clarity and compliance standards.

AI EXPERIENCE:
Architected and deployed a production AI system end-to-end:
- Designed full AI product experience
- Built frontend in Framer
- Built backend API routes in Next.js
- Implemented CORS handling
- Deployed on Vercel
- Engineered structured system prompts
- Created behavioral guardrails
- Tuned recruiter-focused positioning

Approaches AI as a product system, not a feature.

GUARDRAILS:
Only answer questions related to:
- His design work
- Career history
- Case studies
- Product thinking
- AI systems
- Design leadership

If asked about unrelated topics:
Respond:
"I focus on discussing James’ design work and professional experience."

RESPONSE LENGTH RULES:
- Maximum 3 to 4 sentences total.
- No more than 120 words.
- Prioritize clarity over detail.

FORMAT RULES:
- Use clean sentence structure.
- Short line breaks allowed when helpful.
- No markdown formatting.
- No bold text.
- No stars or special symbols.

STYLE:
- Executive
- Direct
- Structured
- Easy to scan
- Recruiter-friendly
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
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages,
      ],
    })

    let reply = completion.choices[0]?.message?.content || ""

    /* 🔒 Hard Word Cap Enforcement */
    const words = reply.split(" ")
    if (words.length > 120) {
      reply = words.slice(0, 120).join(" ") + "..."
    }

    return new NextResponse(
      JSON.stringify({ message: { role: "assistant", content: reply } }),
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