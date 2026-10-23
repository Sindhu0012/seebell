'use client'

import { useState } from 'react'

interface RingDevice {
  id: string
  name: string
  online: boolean
}

export default function RingPanel() {
  const [devices, setDevices] = useState<RingDevice[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function check() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/ring/devices', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDevices(null)
        setError(
          res.status === 401
            ? 'Ring token expired (Playground tokens last 30 min). Get a new one and restart.'
            : data.error || 'Could not reach the Ring API.'
        )
      } else {
        setDevices(data.devices)
      }
    } catch {
      setDevices(null)
      setError('Could not reach the Ring API.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-3xl mx-auto mb-8 rounded-2xl border border-slate-700 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Ring camera</h2>
          <p className="text-slate-400 text-sm">Live check against the Ring API.</p>
        </div>
        <button
          onClick={check}
          disabled={busy}
          className="rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold px-5 py-2 disabled:opacity-60"
        >
          {busy ? 'Checking...' : 'Check Ring camera'}
        </button>
      </div>

      {error && <p className="mt-3 text-red-300">{error}</p>}

      {devices && devices.length === 0 && (
        <p className="mt-3 text-slate-400">Connected, but no devices found.</p>
      )}

      {devices && devices.length > 0 && (
        <ul className="mt-3 space-y-2">
          {devices.map((d) => (
            <li key={d.id} className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold">{d.name}</span>
              <span className="text-slate-400 text-sm">
                connected via Ring API · Playground sandbox, no live status
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
