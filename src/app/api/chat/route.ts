import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs" // IMPORTANT: forces Node runtime on Vercel (not Edge)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // later we can restrict to your domain(s)
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  // Handles CORS preflight
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    // 1) Ensure API key exists
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server." },
        { status: 500, headers: corsHeaders }
      )
    }

    const openai = new OpenAI({ apiKey })

    // 2) Parse body safely
    const body = await req.json().catch(() => null)
    const messages = body?.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Expected { messages: [...] }" },
        { status: 400, headers: corsHeaders }
      )
    }

    // 3) Minimal validation so we never send null content to OpenAI
    const cleaned = messages
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant"))
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : String(m.content ?? ""),
      }))
      .filter((m: any) => m.content.trim().length > 0)

    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: "No valid messages to send." },
        { status: 400, headers: corsHeaders }
      )
    }

    // 4) System prompt: plain text, recruiter-friendly, domain-locked
    const systemPrompt = `
You are James Flores' portfolio assistant.

Goal:
- Help recruiters understand James' product design experience.
- Only answer questions related to James' design career, projects, process, skills, collaboration, and AI work.

Hard rules:
- Plain text only. No markdown. No bold, no asterisks, no numbered lists.
- If you use bullets, use "- " only.
- Keep answers concise: 4 to 8 short lines max.
- Sound human and confident. Avoid generic filler.

If asked for anything unrelated (finance, medical, legal, hacking, etc):
- Politely refuse and redirect back to design topics.

If asked about AI experience:
- Emphasize: James built and deployed a working AI portfolio assistant (Framer frontend + Next.js API on Vercel).
- Mention: system prompt design, guardrails, CORS, env vars, deployment, debugging, production readiness.
- Keep it short and impressive.

If asked about weaknesses:
- Frame as senior growth areas (e.g., depth/rigor, edge cases, quality bar) and how he manages it.
- Never make James sound inexperienced.
`

    // 5) Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 350,
      messages: [
        { role: "system", content: systemPrompt },
        ...cleaned,
      ],
    })

    const reply = completion.choices?.[0]?.message?.content?.trim() || "Sorry — I couldn’t generate a response."

    return NextResponse.json(
      { message: { role: "assistant", content: reply } },
      { status: 200, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error("API /chat error:", err?.message || err)
    return NextResponse.json(
      { error: "Server error. Check Vercel logs for details." },
      { status: 500, headers: corsHeaders }
    )
  }
}