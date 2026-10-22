import { NextResponse } from 'next/server'
import { getStore } from '@/lib/seebell'

export const dynamic = 'force-dynamic'

export async function GET() {
  const store = getStore()
  return NextResponse.json({ current: store.current, log: store.log })
}
