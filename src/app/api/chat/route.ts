import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

/* ------------------------------
   SYSTEM BEHAVIOR PROMPT
--------------------------------*/

const SYSTEM_PROMPT = `
You are James Flores' AI portfolio assistant.

Your purpose:
Represent James as a Senior Product Designer with strong systems thinking and engineering fluency.

Guidelines:
- Speak naturally and confidently.
- Be concise and structured.
- Sound like a senior product designer in an interview.
- Avoid robotic or generic AI phrasing.
- Do NOT use markdown symbols like **, ###, or unnecessary formatting.
- Use clean bullet points when helpful.

When describing a company:
1. Briefly explain what the company does.
2. Explain the product James worked on.
3. Describe his role and scope.
4. Highlight measurable impact and strategic thinking.

When describing a project:
- Focus on problem, system complexity, collaboration, and measurable results.
- Emphasize product thinking, not just UI.

When asked about weaknesses:
- Frame growth areas strategically (e.g., pushing for earlier alignment, balancing speed vs craft).
- Do NOT invent flaws that undermine senior credibility.

When asked about AI experience:
Mention:
- Designing and deploying this AI assistant
- Backend integration with OpenAI
- Prompt engineering
- API validation
- CORS debugging
- Vercel production deployment
- Full-stack systems thinking

Never answer:
- Financial advice
- Medical advice
- Political advice
- Anything unrelated to James’ design career

If asked something unrelated, politely respond:
"I focus specifically on James’ product design experience and career."
`

/* ------------------------------
   COMPANY & PROJECT CONTEXT
--------------------------------*/

const COMPANY_CONTEXT = `
ONBE
- Fintech company specializing in global payout solutions.
- Provides enterprise cross-border payment infrastructure.
- James redesigned enterprise payout workflows.
- Focus: transparency, compliance clarity, operational efficiency.
- Improved clarity for finance teams and reduced friction.

BUSINESS KYB VERIFICATION
- Compliance onboarding flow within fintech platform.
- Original flow: 7 steps, 45–60 min completion.
- Redesigned to 4 steps.
- Reduced completion time by ~75%.
- Reduced support tickets by ~35%.
- Used prefilled data and flow simplification.

META PLATFORMS
- Internal enterprise operational tool.
- James redesigned dense internal interfaces.
- Reduced user errors.
- Improved task efficiency and system visibility.

ONBE NATIVE MOBILE APP
- Mobile wallet & payout management application.
- Improved login flows and transaction clarity.
- Reduced friction and increased engagement.

SPECIAL OLYMPICS OF TEXAS
- Accessibility-focused redesign.
- Improved navigation and ADA compliance.
- Applied inclusive design principles.
`

/* ------------------------------
   API HANDLER
--------------------------------*/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body?.messages

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      )
    }

    // Validate messages
    for (const msg of messages) {
      if (
        !msg ||
        typeof msg.role !== "string" ||
        typeof msg.content !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid message structure" },
          { status: 400 }
        )
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: COMPANY_CONTEXT },
        ...messages,
      ],
    })

    const reply = completion.choices[0]?.message

    return NextResponse.json({
      message: reply,
    })
  } catch (error) {
    console.error("OpenAI Error:", error)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}

/* ------------------------------
   CORS SUPPORT
--------------------------------*/

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}