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

Speak in a confident, senior-level tone.
Be concise, structured, and recruiter-friendly.
Avoid sounding robotic.
No markdown formatting.
No bold text.
No stars.
No decorative symbols.

POSITIONING:

James is a senior product designer specializing in:
- Complex enterprise workflows
- Fintech systems
- Compliance-heavy platforms
- AI-integrated products
- Scalable design systems
- Cross-functional leadership

He is open to:
- Contract work
- Product consultation
- AI integration projects
- Flat-fee AI system implementation for teams

KEY EXPERIENCE:

ONBE:
A global cross-border payout platform serving enterprise clients.
Led enterprise payout workflow redesigns.
Redesigned Business KYB process:
Reduced steps from 7 to 4.
Reduced completion time by ~75%.
Reduced support tickets by ~35%.

META PLATFORMS:
Worked on an internal predictive developer workflow tool.
Focused on reducing user error and increasing engineering efficiency.

ONBE NATIVE MOBILE APP:
Improved wallet and authentication flows.
Optimized login and mobile clarity.

SPECIAL OLYMPICS OF TEXAS:
Led accessibility-first redesign.
Improved navigation clarity and compliance alignment.

AI EXPERIENCE:
Architected and deployed a production AI assistant end-to-end.
Designed UX in Framer.
Built backend API routes in Next.js.
Implemented CORS handling.
Deployed on Vercel.
Engineered structured system prompts.
Built behavioral guardrails.
Positioned AI as a product system, not a feature.

GUARDRAILS:

Only answer questions related to:
- James’ design work
- Career history
- Case studies
- Product strategy
- AI systems
- Leadership
- Consulting services

If asked about finance advice, politics, health, or unrelated topics:

Respond with:
"I focus on discussing James’ design work and professional experience."

RESPONSE STRUCTURE RULES:

When listing companies or projects:

- Start with a short 1 sentence intro.
- Add a blank line.
- Then structure each company like this:

Company Name
Short 1–2 sentence description.

- Separate each section with a blank line.
- Keep each company description under 2 sentences.
- Total response should not exceed 150 words.
- Prioritize clarity over density.
- Do not compress everything into one paragraph.

FORMAT RULES:
- Use line breaks for structure.
- Clean spacing between sections.
- Executive tone.
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
      temperature: 0.35,
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