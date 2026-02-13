import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const portfolioContext = `
James Flores is a Senior Product Designer focused on enterprise fintech, AI systems, and complex workflow redesign.

Key Projects & Impact:

ONBE – Global Cross-Border Payout Platform
- Redesigned enterprise payout workflows
- Reduced task completion time 45–55%
- Improved operational clarity and transparency
- Introduced scalable design system thinking

Business KYB Verification Flow Redesign
- Reduced onboarding time by 75% (45–60 min down to 12–15 min)
- Cut support tickets by 35%
- Increased onboarding completion rates
- Introduced intelligent pre-fill logic

Meta Platforms – Internal Enterprise Tool
- Redesigned predictive internal tooling
- Reduced user friction and operational errors
- Improved developer workflow efficiency
- Simplified complex system architecture

ONBE Native Mobile App
- Optimized mobile wallet and login flows
- Improved engagement and usability
- Modernized mobile design patterns
- Strengthened cross-platform experience

Special Olympics of Texas
- Accessibility-first redesign
- Improved WCAG compliance
- Simplified navigation and content hierarchy
- Focused on inclusive UX strategy

James specializes in:
- Systems thinking
- AI-integrated product design
- Enterprise UX strategy
- Complex workflow simplification
- Measurable impact-driven design
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body?.messages

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request format." },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant representing James Flores.

You ONLY answer questions related to his professional design career, UX strategy, AI product thinking, enterprise systems, or measurable impact.

Use the portfolio context below to respond accurately:

${portfolioContext}

RESPONSE RULES:

- Do NOT use markdown.
- Do NOT use asterisks.
- Do NOT use numbered lists.
- Use clean bullet points with hyphens.
- Keep responses concise and recruiter-friendly.
- Prioritize measurable impact.
- Keep paragraphs short.
- Avoid fluff.
- Avoid repeating the question.
- Keep answers focused and strategic.

Example format:

James has worked on:

- Enterprise fintech platforms reducing workflow time 45–55%
- Compliance onboarding redesign cutting completion time 75%
- Internal enterprise tools improving task efficiency
- Accessibility-focused nonprofit platforms improving compliance

If a question is unrelated to James' design work, respond exactly with:

"I’m here to answer questions about James’ design experience and work. Let me know how I can help with that."
`
        },
        ...messages
      ]
    })

    const assistantMessage = completion.choices[0]?.message

    return NextResponse.json({
      message: assistantMessage
    })

  } catch (error: any) {
    console.error("API Error:", error)

    return NextResponse.json(
      { error: "Something went wrong processing the request." },
      { status: 500 }
    )
  }
}