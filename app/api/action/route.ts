import { NextResponse } from 'next/server'
import { getStore, isActionId } from '@/lib/seebell'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!isActionId(body?.action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const store = getStore()
  if (!store.current) {
    return NextResponse.json({ error: 'No one is at the door' }, { status: 400 })
  }

  store.current.action = body.action
  store.current.actionTime = new Date().toISOString()
  return NextResponse.json(store.current)
}
