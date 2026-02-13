import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ALLOWED_ORIGIN = "https://www.jamesjasonflores.com"

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messages = body?.messages

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request format." },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          },
        }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages,
    })

    const assistantMessage = completion.choices[0]?.message

    return NextResponse.json(
      { message: assistantMessage },
      {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        },
      }
    )
  } catch (error: any) {
    console.error("API Error:", error)

    return NextResponse.json(
      { error: "Server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        },
      }
    )
  }
}