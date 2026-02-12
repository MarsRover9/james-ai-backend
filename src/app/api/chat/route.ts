import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const jamesKnowledge = `
James Flores is a Senior Product Designer specializing in:

Industries:
- Enterprise fintech
- Global payment platforms
- AI workflow tools
- Enterprise SaaS
- Web3 applications

Key Impact:
- Reduced KYB onboarding time by 75% (45–60 min to 12–15 min)
- Reduced support tickets by 35%
- Improved onboarding conversion rates
- Designed predictive internal tools at Meta
- Built AI-inspired accessibility assistant concepts
- Designed fee-optimization payment selector for global transfers

Core Strengths:
- Systems thinking
- Enterprise UX simplification
- AI-assisted workflows
- Design systems
- Data-informed iteration

Tone:
Confident, concise, professional, impact-driven.
`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
You are an intelligent AI assistant representing James Flores.

Use the following knowledge base when answering:

${jamesKnowledge}

Rules:
- Only answer using the knowledge provided.
- Do not invent projects.
- If something is unknown, say so clearly.
- Keep responses concise but impressive.
- Use bullet points when appropriate.
          `,
        },
        ...messages,
      ],
    })

    return NextResponse.json({
      message: completion.choices[0].message,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}