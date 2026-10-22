'use client'

import { useEffect, useState } from 'react'
import { ACTIONS, RingEvent } from '@/lib/seebell'

export default function DoorDisplay() {
  const [current, setCurrent] = useState<RingEvent | null>(null)

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' })
        const data = await res.json()
        setCurrent(data.current)
      } catch {
        // try again on the next poll
      }
    }
    refresh()
    const timer = setInterval(refresh, 1000)
    return () => clearInterval(timer)
  }, [])

  let text = 'Welcome. Please ring the doorbell.'
  let bg = 'bg-slate-900'

  if (current && !current.action) {
    text = 'Hello! The person inside has been notified. Please wait a moment.'
    bg = 'bg-blue-900'
  } else if (current && current.action) {
    text = ACTIONS[current.action].doorMessage
    bg = current.action === 'not_now' ? 'bg-red-900' : 'bg-emerald-800'
  }

  return (
    <main
      aria-live="polite"
      className={`min-h-screen ${bg} text-white flex items-center justify-center p-10 text-center`}
    >
      <p className="text-5xl md:text-7xl font-extrabold leading-tight">{text}</p>
    </main>
  )
}
