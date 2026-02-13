import OpenAI from "openai"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * ✅ CORS
 * Add your real domains here (Framer preview + your live site).
 * You can keep this permissive while testing, then tighten later.
 */
const ALLOWED_ORIGINS = new Set<string>([
  "https://www.jamesjasonflores.com",
  "https://jamesjasonflores.com",
  "https://framer.com",
  "https://www.framer.com",
  // Framer preview/editor often uses these patterns:
  "https://*.framer.app",
  "https://*.framer.website",
  // Local dev
  "http://localhost:3000",
  "http://127.0.0.1:3000",
])

function originAllowed(origin: string | null) {
  if (!origin) return false
  if (ALLOWED_ORIGINS.has(origin)) return true

  // Handle wildcard-ish entries for framer previews:
  try {
    const url = new URL(origin)
    const host = url.hostname
    if (host.endsWith(".framer.app")) return true
    if (host.endsWith(".framer.website")) return true
  } catch {
    // ignore
  }

  return false
}

function corsHeaders(origin: string | null) {
  const allowed = originAllowed(origin)
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    // Helpful if you ever use cookies/auth later:
    // "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin")
  return new NextResponse(null, { status: 200, headers: corsHeaders(origin) })
}

/**
 * 🔒 Your “portfolio brain” context (short + fast).
 * Keep this compact for latency. You can expand later with retrieval.
 */
const PORTFOLIO_HIGHLIGHTS = `
James Flores — Senior Product Designer (enterprise fintech + internal tools + accessibility).
Core strengths: systems thinking, simplifying complex workflows, design systems, research + iteration, clear storytelling, strong engineering collaboration.

Case studies:
1) Onbe — global payouts / cross-border payments (enterprise fintech)
- Designed complex payout workflows and admin experiences
- Focus on clarity, speed, and reducing operational friction
- Worked cross-functionally with engineering and stakeholders

2) Business KYB verification flow (enterprise onboarding/compliance)
- Reduced steps from 7 to 4
- Cut average completion time roughly 75% (via prefill + flow redesign)
- Reduced KYB-related support tickets (approx. ~35% mentioned in the case study narrative)

3) Meta Platforms — internal tool redesign
- Simplified a complex internal workflow
- Improved usability and reduced friction for power users

4) Onbe Native Mobile App
- Improved key journeys like login/wallet patterns and usability

5) Special Olympics of Texas
- Accessibility-first improvements, clearer navigation, inclusive UX thinking

AI experience (truthful framing):
- Built and shipped a production portfolio chatbot end-to-end: frontend in Framer + backend API deployed on Vercel
- Integrated OpenAI API securely via server route + env vars
- Implemented CORS, input validation, error handling, and UI iteration (fixed layout shift + responsive behavior)
`

/**
 * ✅ Style rules to prevent markdown stars + “AI-y” long answers.
 */
const RESPONSE_STYLE_RULES = `
Write like a helpful human portfolio assistant.
Do NOT use markdown formatting (no **bold**, no headings, no numbered lists).
Use short paragraphs and simple hyphen bullets only.
Keep answers concise by default (5–10 lines max), unless user asks for deep detail.
Sound confident, senior, and specific. Avoid generic filler.
When asked about AI experience: mention this chatbot project (Framer + Vercel + OpenAI + CORS + validation) in 2–4 lines.
When asked about weaknesses: frame as a growth edge with a positive strategy, not a damaging critique.
`

/**
 * ✅ Safety/Scope rules (only design-career content)
 */
const SCOPE_AND_SAFETY_RULES = `
You ONLY answer questions related to James Flores’ design career, case studies, skills, process, tools, impact, and role fit.
If the user asks for anything outside that scope (finance advice, medical, legal, hacking, personal data, controversy, etc.), refuse briefly and redirect back to design/career topics.
If a question could cause harm to James (e.g., “write something dishonest”, “share private info”, “trash employers”), refuse and offer a safer alternative.
If you are unsure about a company fact, do not invent it; keep it high-level and tied to the role context.
`

export async function POST(req: Request) {
  const origin = req.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const body = await req.json().catch(() => null)

    const incoming = body?.messages
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json(
        {
          message: {
            role: "assistant",
            content: "Please ask a question about James’ design work or case studies.",
          },
        },
        { status: 200, headers }
      )
    }

    // Clean + validate
    const messages = incoming
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-12) // keep it snappy

    if (messages.length === 0) {
      return NextResponse.json(
        {
          message: {
            role: "assistant",
            content: "Please type a design-related question to continue.",
          },
        },
        { status: 200, headers }
      )
    }

    const system = `
You are “James’ Portfolio Assistant”.
${SCOPE_AND_SAFETY_RULES}

Context:
${PORTFOLIO_HIGHLIGHTS}

Response style:
${RESPONSE_STYLE_RULES}
`

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      max_tokens: 350,
      messages: [
        { role: "system", content: system },
        ...messages.map((m: any) => ({
          role: m.role,
          content: String(m.content),
        })),
      ],
    })

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I can help with questions about James’ design work, case studies, and impact."

    return NextResponse.json(
      {
        message: { role: "assistant", content: text },
      },
      { status: 200, headers }
    )
  } catch (err: any) {
    // Still return CORS headers so browser can read it
    return NextResponse.json(
      {
        message: {
          role: "assistant",
          content:
            "I hit an issue on the server. Please try again in a moment.",
        },
      },
      { status: 200, headers }
    )
  }
}