import { NextResponse } from 'next/server'
import { ACTIONS, getStore } from '@/lib/seebell'

export const dynamic = 'force-dynamic'

export async function GET() {
  const today = new Date().toDateString()
  const events = getStore().log.filter((e) => new Date(e.time).toDateString() === today)

  const count = (type: string) => events.filter((e) => e.analysis.visitor_type === type).length
  const stats = {
    total: events.length,
    delivery: count('delivery'),
    neighbor: count('neighbor'),
    stranger: count('stranger'),
    unknown: count('unknown'),
    highRisk: events.filter((e) => e.analysis.risk === 'high').length,
    replied: events.filter((e) => e.action).length,
  }

  if (events.length === 0) {
    return NextResponse.json({
      stats,
      text: 'No visitors today yet.',
      source: 'mock',
    })
  }

  let text =
    `Today you had ${stats.total} visitor(s): ${stats.delivery} delivery, ` +
    `${stats.neighbor} neighbor, ${stats.stranger} stranger. ` +
    `${stats.highRisk} high-risk. You replied to ${stats.replied} of ${stats.total}.`
  let source: 'gemini' | 'mock' = 'mock'

  const key = process.env.GEMINI_API_KEY
  if (key && process.env.AI_MOCK !== 'true') {
    const lines = events
      .slice()
      .reverse()
      .map(
        (e) =>
          `${new Date(e.time).toLocaleTimeString()} - ${e.analysis.description} ` +
          `(risk: ${e.analysis.risk}, reply: ${e.action ? ACTIONS[e.action].label : 'none'})`
      )
      .join('\n')

    const prompt =
      `You write the daily summary for SeeBell, a doorbell app for deaf and hard-of-hearing people.\n` +
      `Write exactly 2 short plain-language sentences summarizing today's visitors. ` +
      `Mention anything high risk or unanswered. Use only the information below.\n\n${lines}`

    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(20000),
      })
      if (res.ok) {
        const data = await res.json()
        const out: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        if (out.trim()) {
          text = out.trim()
          source = 'gemini'
        }
      } else {
        console.error('Gemini summary error', res.status, await res.text())
      }
    } catch (err) {
      console.error('Gemini summary failed', err)
    }
  }

  return NextResponse.json({ stats, text, source })
}
