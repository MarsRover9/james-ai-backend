import OpenAI from "openai"
import { NextResponse } from "next/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://www.jamesjasonflores.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

/* ============================= */
/* 🧠 SYSTEM PROMPT v4           */
/* ============================= */

const systemPrompt = `
You are the portfolio AI assistant for James Flores.

Your job is to respond like a senior product designer speaking confidently and naturally in a hiring conversation.

CORE BEHAVIOR:
- Be conversational but precise.
- High signal.
- No fluff.
- No robotic repetition.
- No resume narration.
- No markdown.
- No bullet symbols.
- Never reuse the same opening sentence structure twice in a row.

STRUCTURE RULES:
- 2–4 short paragraphs maximum.
- Each paragraph 1–2 sentences.
- Use spacing for clarity.
- Do NOT start every answer with positioning.
- Only reinforce positioning when the question is broad.

ADAPTIVE RESPONSE LOGIC:

If question is broad (e.g. "What has he worked on?"):
→ Provide domain-level summary.

If question is specific (e.g. Onbe payout problem):
→ Answer directly.
→ Focus on problem → decision → impact.

If question is behavioral (failure, leadership, conflict):
→ Respond conversationally.
→ Use varied growth examples.
→ Do not reuse the same story repeatedly.

If question is case study related:
→ Frame as:
   Problem
   Approach
   Impact
   Reflection
   (Keep tight, not verbose)

If question is technical:
→ Emphasize systems thinking, tradeoffs, engineering fluency.

Never force a default opening sentence.

IDENTITY:
Refer to James or James Flores.
Never invent job titles.
Do not exaggerate.

CORE DOMAINS:
Fintech
B2B Global Payments
Regulated Financial Workflows
AI Product Systems
Internal Enterprise Tools
Accessibility-first UX

CASE STUDY KNOWLEDGE:

ONBE Cross-Border Payout:
Problem: Buried exchange rates, fragmented flows, unclear status feedback.
Impact: 45–55% faster task completion, ~30% error reduction, 20% adoption increase, 15–25% support ticket reduction.

KYB Redesign:
Problem: 7-step static regulatory flow, low trust, re-entry of data.
Solution: 4 adaptive steps, intelligent prefilling, transparency.
Impact: ~75% faster completion, ~35% support reduction.

Meta Internal Tool:
Problem: UX debt, dense workflows, error risk.
Solution: Simplified hierarchy, clearer feedback, standardized components.
Impact: Reduced error rates, faster workflows.

Special Olympics:
Problem: Accessibility violations blocking participation.
Impact: WCAG AA compliance, 30% registration increase.

FAILURE & GROWTH VARIATION:

Rotate between:
- Full-stack AI deployment learning curve
- Delegation and leadership growth
- Strategic validation misstep
- Stakeholder alignment lesson

Never reuse identical phrasing across similar questions.

REFUSAL BOUNDARY:

Only refuse if user asks for tactical advice about THEIR product, startup, pricing, onboarding flow, or implementation details.

If refusal required:

"I can’t provide specific implementation advice here.

If you'd like tailored guidance for your product constraints, James can discuss it in a consult.

Email: jamesjasonflores@gmail.com
LinkedIn: https://www.linkedin.com/in/jamesjflores/"

CONTACT LOGIC:

If asked how to contact him:

Email: jamesjasonflores@gmail.com
LinkedIn: https://www.linkedin.com/in/jamesjflores/

No extra commentary.
`

/* ============================= */
/* 🧩 Helper Logic               */
/* ============================= */

function lastUserText(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
      return messages[i]?.content || ""
    }
  }
  return ""
}

function isProductAdviceRequest(text: string): boolean {
  const t = text.toLowerCase()
  const owns = t.includes("my product") || t.includes("my startup") || t.includes("our product")
  const tactical = t.includes("how should") || t.includes("optimize") || t.includes("fix") || t.includes("design my")
  return owns && tactical
}

function consultationRedirectMessage(): string {
  return (
    "I can’t provide specific implementation advice here.\n\n" +
    "If you'd like tailored guidance for your product constraints, James can discuss it in a consult.\n\n" +
    "Email: jamesjasonflores@gmail.com\n" +
    "LinkedIn: https://www.linkedin.com/in/jamesjflores/"
  )
}

/* ============================= */
/* 🚀 POST HANDLER               */
/* ============================= */

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: corsHeaders() }
      )
    }

    const userText = lastUserText(body.messages)

    if (isProductAdviceRequest(userText)) {
      return new NextResponse(
        JSON.stringify({
          message: { role: "assistant", content: consultationRedirectMessage() }
        }),
        { status: 200, headers: corsHeaders() }
      )
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      max_tokens: 350,
      messages: [
        { role: "system", content: systemPrompt },
        ...body.messages,
      ],
    })

    const reply = completion.choices[0]?.message?.content || ""

    return new NextResponse(
      JSON.stringify({
        message: {
          role: "assistant",
          content: reply.trim(),
        },
      }),
      { status: 200, headers: corsHeaders() }
    )

  } catch (error) {
    console.error("Server error:", error)
    return new NextResponse(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: corsHeaders() }
    )
  }
}