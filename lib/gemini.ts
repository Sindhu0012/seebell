import { Analysis, MOCK_ANALYSES } from '@/lib/seebell'

const PROMPT = `You are the vision assistant for SeeBell, a doorbell app for deaf and hard-of-hearing people.
Look at this doorbell camera image and describe who is at the door.
Reply with JSON only, using exactly these keys:
{
  "visitor_type": "delivery" | "neighbor" | "stranger" | "unknown",
  "description": one plain-language sentence, max 20 words, about who is there and what they are holding,
  "carrying": "package" | "nothing" | "unclear",
  "risk": "low" | "medium" | "high",
  "risk_reason": a short reason, or an empty string if risk is low,
  "suggested_action": "leave_at_door" | "coming" | "not_now"
}
Rules: a person in a delivery uniform with a package is delivery, low risk, leave_at_door.
A person who looks friendly and familiar is a neighbor, low risk, coming.
Someone hiding their face, looking around, or trying the door is a stranger, high risk, not_now.
If nobody is visible, use visitor_type "unknown" and say that no one is visible.
Never guess names or identities. Describe only what you can see.`

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

export async function analyzeImage(
  dataUrl: string
): Promise<{ analysis: Analysis; source: 'gemini' | 'mock' }> {
  const fallback = { analysis: MOCK_ANALYSES.stranger, source: 'mock' as const }

  const key = process.env.GEMINI_API_KEY
  if (!key || process.env.AI_MOCK === 'true') return fallback

  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl)
  if (!match) return fallback

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: match[1], data: match[2] } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!res.ok) {
      console.error('Gemini error', res.status, await res.text())
      return fallback
    }

    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const raw = JSON.parse(text.replace(/```json|```/g, '').trim())

    const analysis: Analysis = {
      visitor_type: oneOf(raw.visitor_type, ['delivery', 'neighbor', 'stranger', 'unknown'], 'unknown'),
      description:
        typeof raw.description === 'string' && raw.description
          ? raw.description
          : 'Someone is at the door.',
      carrying: oneOf(raw.carrying, ['package', 'nothing', 'unclear'], 'unclear'),
      risk: oneOf(raw.risk, ['low', 'medium', 'high'], 'medium'),
      risk_reason: typeof raw.risk_reason === 'string' ? raw.risk_reason : '',
      suggested_action: oneOf(raw.suggested_action, ['leave_at_door', 'coming', 'not_now'], 'not_now'),
    }
    return { analysis, source: 'gemini' }
  } catch (err) {
    console.error('Gemini call failed', err)
    return fallback
  }
}
