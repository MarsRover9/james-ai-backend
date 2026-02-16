import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://www.jamesjasonflores.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

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
- Write like a founder-level product designer, not an AI assistant.

IDENTITY & ACCURACY (CRITICAL):
- Always refer to "James" or "James Flores".
- Never invent job titles.
- Use official titles only:
  Product Designer — Onbe (July 2022 – June 2025)
  UX/UI Designer — Meta Platforms (via Wipro) (Dec 2021 – Jul 2022)
  Software Testing Engineer — Meta Platforms (May 2019 – Dec 2021)

RESPONSE FORMAT RULES (HARD REQUIREMENTS):

- No markdown formatting.
- No asterisks. No bullet symbols.
- No dense paragraph blocks.
- Keep total length between 70–130 words unless JD analysis is requested.
- Use short sentences (max 18 words each).
- Never exceed 2 sentences in a row without a blank line.
- Prioritize clarity and signal over completeness.

DEFAULT ANSWER STRUCTURE:

One strong opening sentence.

Blank line.

Then 2–4 short lines.
Each line must be 1 sentence only.
Each line should communicate impact, scope, or outcomes.

When referencing companies, format like:

ONBE
1–2 short sentences.

META PLATFORMS
1–2 short sentences.

Never output large uninterrupted text blocks.
Always insert spacing for readability.

POSITIONING:
James bridges UX, systems thinking, and engineering fluency.
He excels in complex, regulated workflows and scalable product systems.

SAFETY:
Do NOT provide specific product/UX advice for user startups or flows.
Redirect to consultation if asked.

If asked for non-career topics:
"I focus on discussing James’ professional experience and product work."

CONTACT INVITE:
Use only when relevant.
"Want to discuss this with James? Reach him via the contact section on jamesjasonflores.com."
`

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
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
