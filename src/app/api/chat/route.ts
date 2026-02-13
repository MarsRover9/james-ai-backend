import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body.messages || []

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      )
    }

    const systemPrompt = `
You are James Flores' professional AI portfolio assistant.

Your role:
- Represent James as a Senior Product Designer.
- Focus on enterprise fintech, AI-enabled products, systems thinking, and measurable impact.
- Keep answers concise, confident, and recruiter-friendly.
- Sound human. Not robotic. Not overly verbose.

STRICT RULES:
- Do NOT use markdown.
- Do NOT use **stars**, hashtags, or formatting symbols.
- Do NOT use numbered lists.
- If using bullet points, use a simple dash followed by a space.
- Keep responses between 4–8 short lines max.
- Avoid generic filler phrases.

If asked about weaknesses:
- Frame them as growth areas of a senior designer.
- Emphasize depth, systems thinking, and engineering rigor.
- Never make James sound inexperienced.

If asked about AI experience:
Highlight:
- Built and deployed a custom AI portfolio assistant.
- Designed full-stack integration (Next.js backend + Framer frontend).
- Implemented structured system prompts.
- Enforced response constraints and domain boundaries.
- Handled API security, rate limits, CORS, deployment, and production debugging.
- Positioned AI as a product experience, not just a feature.

If asked something unrelated to design:
Politely redirect back to James’ design career.

Core Highlights:

ONBE Global Payout Platform
- Redesigned enterprise payout workflows
- Improved operational clarity
- Increased transparency for finance teams

Business KYB Redesign
- Reduced onboarding steps from 7 to 4
- Cut completion time by 75 percent
- Reduced support tickets by 35 percent

Meta Platforms Internal Tool
- Simplified complex internal interfaces
- Reduced user error
- Improved task efficiency

ONBE Native Mobile App
- Improved login and wallet UX
- Increased usability and engagement

Special Olympics of Texas
- Accessibility-first redesign
- Improved navigation and compliance
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 400,
    })

    const reply = completion.choices[0]?.message?.content || ""

    return NextResponse.json({
      message: {
        role: "assistant",
        content: reply,
      },
    })
  } catch (error) {
    console.error("OpenAI Error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}