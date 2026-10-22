'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ACTIONS, ActionId, RingEvent, Scenario } from '@/lib/seebell'

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: 'delivery', label: 'Delivery person' },
  { id: 'neighbor', label: 'Neighbor' },
  { id: 'stranger', label: 'Stranger' },
]

const RISK_LABEL = { low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK' }

export default function SeeBellPage() {
  const [current, setCurrent] = useState<RingEvent | null>(null)
  const [log, setLog] = useState<RingEvent[]>([])
  const lastId = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' })
      const data = await res.json()
      setCurrent(data.current)
      setLog(data.log)
    } catch {
      // server not reachable, try again on the next poll
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 1000)
    return () => clearInterval(timer)
  }, [refresh])

  // Vibrate the phone once for every new ring
  useEffect(() => {
    if (current && !current.action && current.id !== lastId.current) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([400, 150, 400, 150, 400])
      }
    }
    if (current) lastId.current = current.id
  }, [current])

  async function simulate(scenario: Scenario) {
    await fetch('/api/simulate-ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    refresh()
  }

  async function choose(action: ActionId) {
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    refresh()
  }

  const alerting = current !== null && current.action === null

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <style>{`
        @keyframes flashLow { 0%,100% { background:#14532d } 50% { background:#16a34a } }
        @keyframes flashMedium { 0%,100% { background:#713f12 } 50% { background:#d97706 } }
        @keyframes flashHigh { 0%,100% { background:#7f1d1d } 50% { background:#dc2626 } }
      `}</style>

      <header className="max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-extrabold">SeeBell</h1>
        <p className="text-slate-300 text-lg">A doorbell you can see.</p>
      </header>

      <section className="max-w-3xl mx-auto mb-8 rounded-2xl border border-slate-700 p-5">
        <h2 className="text-xl font-bold mb-1">Demo controls</h2>
        <p className="text-slate-400 mb-4">
          Simulates someone pressing the doorbell (the Ring Playground has no real events).
        </p>
        <div className="flex flex-wrap gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => simulate(s.id)}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-3"
            >
              Simulate: {s.label}
            </button>
          ))}
          <a
            href="/door"
            target="_blank"
            className="rounded-xl border border-slate-500 px-5 py-3 font-bold hover:bg-slate-800"
          >
            Open door display
          </a>
        </div>
      </section>

      {current && current.action && (
        <section className="max-w-3xl mx-auto mb-8 rounded-2xl bg-emerald-900 p-5">
          <p className="text-lg">
            Reply sent: <b>{ACTIONS[current.action].label}</b>
          </p>
          <p className="text-emerald-200">{ACTIONS[current.action].doorMessage}</p>
        </section>
      )}

      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-3">Visitor log</h2>
        {log.length === 0 && <p className="text-slate-400">No visitors yet.</p>}
        <ul className="space-y-3">
          {log.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-700 p-4">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>{new Date(e.time).toLocaleTimeString()}</span>
                <span>{RISK_LABEL[e.analysis.risk]}</span>
              </div>
              <p className="text-lg font-semibold mt-1">{e.analysis.description}</p>
              <p className="text-slate-300">
                Your reply: {e.action ? ACTIONS[e.action].label : 'no reply yet'}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {alerting && current && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Someone is at the door"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6 text-center text-white"
          style={{
            animation: `${
              current.analysis.risk === 'high'
                ? 'flashHigh'
                : current.analysis.risk === 'medium'
                ? 'flashMedium'
                : 'flashLow'
            } 1s infinite`,
          }}
        >
          <p className="text-6xl md:text-8xl font-extrabold">SOMEONE IS AT THE DOOR</p>
          <p className="text-3xl md:text-5xl font-bold max-w-4xl">
            {current.analysis.description}
          </p>
          <p className="text-2xl md:text-3xl font-bold bg-black/50 rounded-full px-6 py-2">
            {RISK_LABEL[current.analysis.risk]}
            {current.analysis.risk_reason ? `: ${current.analysis.risk_reason}` : ''}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {(Object.keys(ACTIONS) as ActionId[]).map((id) => (
              <button
                key={id}
                onClick={() => choose(id)}
                aria-label={ACTIONS[id].label}
                className={`rounded-2xl bg-white text-black text-3xl font-extrabold px-8 py-6 ${
                  id === current.analysis.suggested_action ? 'ring-8 ring-yellow-300' : ''
                }`}
              >
                {ACTIONS[id].label}
                {id === current.analysis.suggested_action && (
                  <span className="block text-base font-semibold">suggested</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
