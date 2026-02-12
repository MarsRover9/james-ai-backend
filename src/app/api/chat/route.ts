import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userMessage = body.message || body.input || ""

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "No valid message provided." },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant representing James Flores, a senior product designer. Speak clearly, professionally, and concisely.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    })

    return NextResponse.json({
      reply: completion.choices[0].message.content,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}