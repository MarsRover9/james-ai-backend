import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * 🔒 Design-Focused System Prompt
 */
const SYSTEM_PROMPT = `
You are James Flores' AI portfolio assistant.

Your ONLY purpose is to answer questions related to:
- James' design experience
- Case studies
- UX/UI process
- Product thinking
- Design systems
- AI product design
- Measurable impact
- Career background

If asked about:
- Finance advice
- Politics
- Medical advice
- Crypto investing
- Legal topics
- Anything unrelated to James' design career

You must politely refuse and redirect back to his design work.

Keep responses:
- Clear
- Professional
- Easy to scan
- Bullet formatted when listing items
- Concise but strong

Never fabricate unknown information.
Only reference verified portfolio data below.

---

Portfolio Highlights:

ONBE – Global Cross-Border Payout Platform
• Redesigned enterprise payout workflows
• Increased operational transparency
• Improved task clarity for finance teams
• Focused on systems thinking + scalability

Business KYB Verification Flow
• Reduced onboarding steps from 7 → 4
• Reduced completion time by ~75%
• Reduced support tickets by ~35%
• Prefilled data to streamline compliance flows

Meta Platforms – Internal Tool
• Redesigned complex internal interface
• Reduced user errors
• Improved task efficiency for developers
• Enterprise UX + predictive workflow thinking

ONBE Native Mobile App
• Improved login + wallet UX
• Increased engagement + usability
• Optimized mobile-first financial flows

Special Olympics of Texas
• Accessibility-first redesign
• Improved navigation clarity
• Focused on WCAG compliance
• Mission-driven impact work

---

If a question is unclear, ask a clarifying question.

Respond as a polished, confident design assistant.
`

/**
 * 🌍 CORS Headers
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

/**
 * Preflight Handler (Required for CORS)
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * Main Chat Endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const incomingMessages = body?.messages

    if (!incomingMessages || !Array.isArray(incomingMessages)) {
      return NextResponse.json(
        { error: "Invalid request format." },
        { status: 400, headers: corsHeaders }
      )
    }

    /**
     * 🔒 Sanitize messages to prevent null / malformed content
     */
    const cleanMessages = incomingMessages
      .filter(
        (m: any) =>
          m &&
          typeof m.role === "string" &&
          typeof m.content === "string" &&
          m.content.trim() !== ""
      )
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }))

    if (cleanMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages provided." },
        { status: 400, headers: corsHeaders }
      )
    }

    /**
     * 🤖 OpenAI Call
     */
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...cleanMessages,
      ],
    })

    const assistantMessage = completion.choices[0]?.message

    return NextResponse.json(
      { message: assistantMessage },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("API Error:", error)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    )
  }
}