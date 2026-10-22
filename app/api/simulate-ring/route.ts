import { NextResponse } from 'next/server'
import { getStore, isScenario, MOCK_ANALYSES, RingEvent, Scenario } from '@/lib/seebell'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let scenario: Scenario = 'delivery'
  try {
    const body = await request.json()
    if (isScenario(body?.scenario)) scenario = body.scenario
  } catch {
    // no body sent, use the default scenario
  }

  const event: RingEvent = {
    id: Date.now().toString(),
    time: new Date().toISOString(),
    scenario,
    analysis: MOCK_ANALYSES[scenario],
    action: null,
    actionTime: null,
  }

  const store = getStore()
  store.current = event
  store.log.unshift(event)
  return NextResponse.json(event)
}
