import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// -------------------------
// CORS PRE-FLIGHT SUPPORT
// -------------------------
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  )
}

// -------------------------
// KNOWLEDGE BASE (Condensed)
// -------------------------
const portfolioContext = `
James Flores is a Senior Product Designer specializing in enterprise fintech, AI systems, and complex workflow design.

CASE STUDY: ONBE – Global Cross-Border Payout Platform
- Led UX redesign of enterprise payout workflows.
- Reduced workflow time by ~45–55%.
- Increased feature adoption ~20%.
- Reduced payout support tickets 15–25%.
- Focused on transparency, fee clarity, and progressive disclosure.

CASE STUDY: BUSINESS KYB VERIFICATION
- Redesigned enterprise compliance onboarding flow.
- Reduced completion time ~75% (45–60 min → 12–15 min).
- Reduced support tickets ~35%.
- Implemented adaptive steps + intelligent prefill.
- Balanced regulatory compliance with usability.

CASE STUDY: META PLATFORMS – INTERNAL TOOL
- Redesigned complex internal enterprise interface.
- Reduced user errors.
- Improved task completion speed.
- Simplified hierarchy and system feedback.

CASE STUDY: ONBE NATIVE MOBILE APP
- Optimized mobile fintech login + wallet experience.
- Reduced login abandonment.
- Improved tap targets and interaction clarity.
- Increased mobile engagement.

CASE STUDY: SPECIAL OLYMPICS OF TEXAS
- Accessibility-first redesign.
- Improved WCAG compliance.
- Increased successful registrations.
- Simplified navigation and inclusive UX.

Core Strengths:
- Systems thinking
- Enterprise UX simplification
- AI product integration
- Regulatory UX
- Design systems
- Data-informed iteration
`

// -------------------------
// MAIN API HANDLER
// -------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userMessage = body.message

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "Invalid message." },
        { status: 400 }
      )
    }

    // -------------------------
    // LIGHT BACKEND GUARDRAILS
    // -------------------------
    const disallowedKeywords = [
      "investment",
      "stocks",
      "crypto",
      "medical",
      "diagnosis",
      "therapy",
      "legal advice",
      "lawsuit",
      "politics",
      "religion",
      "violence",
      "hate",
      "financial advice",
    ]

    const lowerMessage = userMessage.toLowerCase()

    if (disallowedKeywords.some((word) => lowerMessage.includes(word))) {
      return NextResponse.json(
        {
          reply:
            "I’m here to answer questions about James’ design experience and work. Let me know how I can help with that.",
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      )
    }

    // -------------------------
    // OPENAI CALL
    // -------------------------
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant representing James Flores.

You ONLY answer questions related to his professional design career, case studies, UX strategy, systems thinking, AI product work, and measurable impact.

Use the portfolio context below to answer accurately and confidently:

${portfolioContext}

Rules:
- Emphasize measurable impact.
- Highlight systems thinking and tradeoffs.
- Speak concisely but insightfully.
- Do NOT answer financial, medical, political, religious, or harmful questions.
- If a question is unrelated to his design work, respond exactly with:

"I’m here to answer questions about James’ design experience and work. Let me know how I can help with that."
`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    })

    return NextResponse.json(
      {
        reply: completion.choices[0].message.content,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
}