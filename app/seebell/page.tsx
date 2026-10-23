'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ACTIONS, ActionId, RingEvent, Scenario } from '@/lib/seebell'
import RingPanel from '@/components/RingPanel'

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: 'delivery', label: 'Delivery person' },
  { id: 'neighbor', label: 'Neighbor' },
  { id: 'stranger', label: 'Stranger' },
]

const RISK_LABEL = { low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK' }

interface Summary {
  stats: {
    total: number
    delivery: number
    neighbor: number
    stranger: number
    unknown: number
    highRisk: number
    replied: number
  }
  text: string
  source: 'gemini' | 'mock'
}

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = url
  })
}

export default function SeeBellPage() {
  const [current, setCurrent] = useState<RingEvent | null>(null)
  const [log, setLog] = useState<RingEvent[]>([])
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [summaryBusy, setSummaryBusy] = useState(false)
  const lastId = useRef<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  async function ringWithPhoto(file: File) {
    setBusy(true)
    try {
      const image = await resizeToDataUrl(file)
      await fetch('/api/simulate-ring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      await refresh()
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function choose(action: ActionId) {
    await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    refresh()
  }

  async function makeSummary() {
    setSummaryBusy(true)
    try {
      const res = await fetch('/api/summary', { cache: 'no-store' })
      setSummary(await res.json())
    } catch {
      // ignore, the button can be pressed again
    } finally {
      setSummaryBusy(false)
    }
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

      <RingPanel />

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
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-3 disabled:opacity-60"
          >
            {busy ? 'AI is looking...' : 'Ring with a photo (real AI)'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) ringWithPhoto(file)
            }}
          />
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

      <section className="max-w-3xl mx-auto mb-8 rounded-2xl border border-slate-700 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold">Daily summary</h2>
          <button
            onClick={makeSummary}
            disabled={summaryBusy}
            className="rounded-xl bg-violet-400 hover:bg-violet-300 text-black font-bold px-5 py-2 disabled:opacity-60"
          >
            {summaryBusy ? 'Writing...' : 'Summarize today'}
          </button>
        </div>
        {summary ? (
          <div className="mt-4">
            <p className="text-lg">{summary.text}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-800 px-3 py-1">
                {summary.stats.total} visitors
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1">
                {summary.stats.delivery} delivery
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1">
                {summary.stats.neighbor} neighbor
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1">
                {summary.stats.stranger} stranger
              </span>
              <span className="rounded-full bg-red-900 px-3 py-1">
                {summary.stats.highRisk} high risk
              </span>
              <span className="rounded-full bg-slate-800 px-3 py-1">
                {summary.stats.replied} replied
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {summary.source === 'gemini' ? 'Written by AI: Gemini' : 'Demo mode summary'}
            </p>
          </div>
        ) : (
          <p className="text-slate-400 mt-2">Press the button to summarize today&apos;s visitors.</p>
        )}
      </section>

      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-3">Visitor log</h2>
        {log.length === 0 && <p className="text-slate-400">No visitors yet.</p>}
        <ul className="space-y-3">
          {log.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-700 p-4 flex gap-4">
              {e.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.image}
                  alt="Camera snapshot of the visitor"
                  className="h-20 w-28 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>
                    {new Date(e.time).toLocaleTimeString()} ·{' '}
                    {e.source === 'gemini' ? 'AI: Gemini' : 'demo mode'}
                  </span>
                  <span>{RISK_LABEL[e.analysis.risk]}</span>
                </div>
                <p className="text-lg font-semibold mt-1">{e.analysis.description}</p>
                <p className="text-slate-300">
                  Your reply: {e.action ? ACTIONS[e.action].label : 'no reply yet'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {alerting && current && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Someone is at the door"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 p-6 text-center text-white"
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
          {current.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.image}
              alt="Camera snapshot of the visitor"
              className="h-40 rounded-xl border-4 border-white object-cover"
            />
          )}
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
