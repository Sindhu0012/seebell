import { NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/gemini'
import { getStore, isScenario, MOCK_ANALYSES, RingEvent } from '@/lib/seebell'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const image: string | null =
    typeof body?.image === 'string' && body.image.startsWith('data:image/') ? body.image : null

  let event: RingEvent

  if (image) {
    const result = await analyzeImage(image)
    event = {
      id: Date.now().toString(),
      time: new Date().toISOString(),
      scenario: 'photo',
      analysis: result.analysis,
      source: result.source,
      image,
      action: null,
      actionTime: null,
    }
  } else {
    const scenario = isScenario(body?.scenario) ? body.scenario : 'delivery'
    event = {
      id: Date.now().toString(),
      time: new Date().toISOString(),
      scenario,
      analysis: MOCK_ANALYSES[scenario],
      source: 'mock',
      image: null,
      action: null,
      actionTime: null,
    }
  }

  const store = getStore()
  store.current = event
  store.log.unshift(event)
  store.log = store.log.slice(0, 20)
  return NextResponse.json({ id: event.id, source: event.source })
}
