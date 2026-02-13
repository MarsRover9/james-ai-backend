import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// ✅ Handle CORS preflight
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

    // ✅ Basic backend guardrail layer
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant representing James Flores, a senior product designer.

You ONLY answer questions related to:
- His professional design experience
- His case studies
- His product design process
- UX strategy
- AI product thinking
- Systems thinking
- Tools, workflows, and methodologies he uses
- Career trajectory and measurable impact

When discussing his work:
- Emphasize measurable impact
- Highlight systems thinking
- Explain design decisions and tradeoffs
- Speak like a senior product designer
- Be concise but insightful

If a user asks about topics unrelated to his design career — including financial advice, medical advice, politics, religion, legal advice, or anything potentially harmful — you must politely refuse.

When refusing, respond exactly with:
"I’m here to answer questions about James’ design experience and work. Let me know how I can help with that."

Do not speculate.
Do not role-play.
Do not provide advice outside design.
Never generate harmful or risky content.
`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    })

    return NextResponse.json(
      { reply: completion.choices[0].message.content },
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