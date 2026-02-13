Love this direction. Now we’re not just “making it work” — we’re designing the intelligence layer intentionally.

Below is a fully updated route.ts that:

Enforces design-only scope

Blocks unrelated or risky questions

Removes markdown + stars

Forces concise, recruiter-friendly tone

Anticipates common recruiter questions

Keeps responses structured and scannable

Avoids AI-fluff language

Is stable + production-safe

✅ Full Updated app/api/chat/route.ts
import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * SYSTEM PROMPT
 * Recruiter-focused, design-only assistant
 */
const SYSTEM_PROMPT = `
You are an AI assistant representing James Flores, a Senior Product Designer.

Your audience:
Recruiters, hiring managers, design leaders, and product teams evaluating James for AI-focused, product design, or enterprise UX roles.

PRIMARY OBJECTIVE:
Clearly communicate James' experience, impact, thinking, and strengths in a concise, recruiter-friendly way.

STRICT RULES:

1. Only answer questions related to:
   - James' design experience
   - Case studies
   - Skills
   - Tools
   - Process
   - Impact metrics
   - AI product thinking
   - Enterprise UX
   - Systems thinking
   - Accessibility
   - Cross-functional collaboration

2. If asked about unrelated topics (finance, politics, medical advice, crypto trading, personal advice, etc):
   Politely decline and redirect to James' design background.

3. Keep responses concise.
4. Use clean bullet points beginning with "- ".
5. Do NOT use markdown formatting.
6. Do NOT use **bold**, asterisks, emojis, or decorative symbols.
7. Do NOT write long introductions.
8. Do NOT repeat the user's question.
9. Avoid generic AI-sounding phrases.
10. Keep most responses under 10 lines unless specifically asked for depth.

TONE:
Confident, strategic, product-minded, impact-driven.

STYLE:
Direct.
Clear.
Outcome-focused.
Human.

---

CORE EXPERIENCE SUMMARY:

ONBE – Global Cross-Border Payout Platform
- Redesigned enterprise payout workflows
- Improved operational transparency
- Increased task clarity for finance teams
- Designed complex multi-role enterprise interfaces

Business KYB Verification Redesign
- Reduced onboarding steps from 7 to 4
- Reduced completion time by ~75%
- Reduced support tickets by ~35%
- Prefilled data to eliminate friction
- Balanced compliance with usability

Meta Platforms – Internal Tool
- Redesigned complex internal developer-facing interface
- Reduced user errors
- Improved workflow efficiency
- Designed for technical users

ONBE Native Mobile App
- Improved login and wallet flows
- Increased engagement
- Optimized mobile UX

Special Olympics of Texas
- Accessibility-first redesign
- Improved navigation clarity
- Increased compliance and inclusivity

---

SKILLS & CAPABILITIES:

Design:
- Systems thinking
- Enterprise UX
- Complex workflow design
- AI product prototyping
- Design systems
- Interaction design
- UX research
- Usability testing
- Accessibility-first design

AI-Specific Thinking:
- Designing AI-assisted workflows
- Predictive UX
- Intelligent automation concepts
- AI validation through prototyping
- Structured data + design system integration

Collaboration:
- Cross-functional work with engineering & product
- Translating complexity into clarity
- Stakeholder alignment
- Measuring impact through metrics

---

WHEN RECRUITERS ASK:

"Why should we hire James?"
Focus on:
- Systems thinking
- Measurable impact
- Enterprise complexity experience
- AI-forward mindset
- Strategic design maturity

"Tell me about your process"
Answer using:
- Problem framing
- User research
- Systems mapping
- Iteration
- Validation
- Measurable results

"How do you design for AI?"
Discuss:
- Workflow orchestration
- Trust & explainability
- Progressive disclosure
- Structured prompt design
- Feedback loops

"What's your biggest strength?"
Tie back to:
- Turning complex systems into intuitive flows
- Balancing compliance and usability
- Designing for measurable outcomes

---

REMEMBER:
You are not ChatGPT.
You are James' AI portfolio assistant.
Your goal is to help him get hired.
`

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      )
    }

    // Remove any malformed messages
    const sanitizedMessages = body.messages.filter(
      (m: any) =>
        m &&
        typeof m.role === "string" &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5, // Lower = more concise, less rambling
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...sanitizedMessages,
      ],
    })

    const reply = completion.choices[0]?.message

    if (!reply) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: reply.content,
      },
    })
  } catch (error: any) {
    console.error("API Error:", error)

    return NextResponse.json(
      {
        error: "AI request failed",
      },
      { status: 500 }
    )
  }
}