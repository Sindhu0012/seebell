# SeeBell: a doorbell you can see

SeeBell makes the front door accessible for deaf and hard-of-hearing people. When someone rings, the whole screen flashes, the text is huge, the phone vibrates, and an AI tells you who is outside and how risky it looks. You reply with one tap, and the visitor reads your answer in big text on a door display.

Built for the **Amazon Developer Hackathon**, Ring track (accessibility).

## The problem

Over 400 million people worldwide have disabling hearing loss, and the doorbell is still a sound-only product. If you can't hear it, you miss deliveries, visitors and sometimes safety warnings.

## How it works

Doorbell press (simulated) -> camera photo -> Gemini AI describes the visitor -> full-screen alert -> you tap a reply -> the visitor reads it on the door display -> everything goes in the visitor log.

### 1. Alert: someone is at the door

The screen flashes green, amber or red by risk level, with huge text, phone vibration, a snapshot, the AI description, and a suggested reply highlighted.

![SeeBell alert with AI description]<img width="1362" height="673" alt="alert-screen" src="https://github.com/user-attachments/assets/3d1f366f-23a0-4464-9cdb-ba1edc3a7721" />



### 2. Door display: the visitor reads your reply

After you tap Coming, Leave at door or Not now, the `/door` page shows your answer in big, high-contrast text.

![Door display]<img width="1364" height="681" alt="door-display" src="https://github.com/user-attachments/assets/99521ef5-2df6-49b5-aab4-aeeb5de9628b" />



### 3. Home: demo controls and Ring camera check

Simulate a visitor, ring with a real photo to run the AI, check the Ring camera through the Ring API, and open the door display.

![SeeBell home]<img width="1364" height="681" alt="home-screen" src="https://github.com/user-attachments/assets/36057bd2-505a-44f1-9a2a-ead0d5dbe405" />



### 4. Visitor log and daily summary

Every visit is logged with its snapshot, the AI description, the risk level and your reply. The daily summary counts the day's visitors in code, then Gemini writes a short summary.

![Visitor log and daily summary]<img width="1357" height="673" alt="visitor-log" src="https://github.com/user-attachments/assets/6c1f1143-caab-439d-9662-045eac66f894" />



## Features

- Full-screen visual alert with color by risk, huge text, phone vibration and screen-reader support
- AI visitor description with a strict JSON result (visitor type, description, package or not, risk level and reason, suggested reply), validated, with a safe fallback if the AI fails
- One-tap replies: Coming, Leave at door, Not now
- Door display page for the visitor, updating live
- Visitor log with snapshots, labelled "AI: Gemini" or "demo mode"
- Daily summary
- Ring API device check

## Accessibility

- Risk is never shown by color alone. Every alert also has a text label (LOW, MEDIUM or HIGH RISK).
- Very large text and large buttons.
- Vibration on every new ring.
- Alert dialog with `aria-live`, labelled buttons, and an `aria-live` door display.
- The AI describes only what is visible. It never guesses names or identities.

## What is real and what is simulated

The Ring Developer Playground has no real doorbell-press events, no webhooks in token mode, and a device with no speaker. So:

| Part | Status |
|---|---|
| Ring API connection (device lookup with a Playground token) | Real |
| AI visitor analysis (Gemini) | Real |
| Alert, vibration, replies, door display, log, summary | Real |
| Doorbell press | Simulated with a button |
| Camera frame given to the AI | An uploaded photo stands in for it |
| Speaking to the visitor through the doorbell | Not possible with the Playground device, so the reply is text on the door display |

The starter's own dashboard at `/` still shows the live Playground camera stream.

## Tech stack

Next.js 15 (App Router), TypeScript, Tailwind CSS, Ring API, Google Gemini API.

## What's new vs Amazon's starter

SeeBell starts from Amazon's MIT-licensed `ring-api-helloworld` starter. The starter's Ring code (`app/api/ring/*`, `lib/auth.ts`) is kept and used. Added during the hackathon:

| File | What it does |
|---|---|
| `lib/seebell.ts` | Types, mock scenarios, reply actions, in-memory store |
| `lib/gemini.ts` | Gemini vision call, JSON contract, validation, fallback |
| `app/api/simulate-ring` | Simulated ring: mock scenario, or photo plus real AI |
| `app/api/state`, `app/api/action` | Live state and reply handling |
| `app/api/summary` | Daily summary |
| `app/seebell/page.tsx` | Alert screen, demo controls, visitor log, summary |
| `app/door/page.tsx` | Visitor-facing door display |
| `RingPanel` component | Ring API device check |

## Setup

You need Node.js 18 or newer, a free Ring Developer account, and (optional) a free Gemini API key.

```bash
git clone https://github.com/Sindhu0012/seebell.git
cd seebell
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | What it is |
|---|---|---|
| `RING_ACCESS_TOKEN` | For the Ring check | Token from the Ring Developer Playground (https://developer.amazon.com/ring/console/playground). It expires after about 30 minutes. |
| `GEMINI_API_KEY` | For real AI | Free key from https://aistudio.google.com/apikey. Without it, the app runs in demo mode with canned answers. |
| `GEMINI_MODEL` | No | Default in code is `gemini-2.5-flash`. If you get a 404, set a model your key supports (we developed with `gemini-3.8-flash`). |
| `AI_MOCK` | No | Set to `true` to skip Gemini entirely. |

Run it:

```bash
npm run dev
```

1. Open http://localhost:3000/seebell
2. Open http://localhost:3000/door in a second tab.
3. Click a Simulate button, or "Ring with a photo (real AI)".
4. Tap a reply and watch the door tab change.

Never commit `.env.local`. It is already in `.gitignore`.

## Troubleshooting

- `EADDRINUSE` on start: run `fuser -k 3000/tcp`, then `npm run dev` again.
- 401 from the Ring API or the page at `/`: the Playground token expired. Make a new one and update `.env.local`.
- Changed `.env.local` but nothing happened: restart the dev server.
- Log says "demo mode": the Gemini key is missing, `AI_MOCK=true`, or the call failed. Check the terminal for a Gemini error.

## Privacy and AI notes

- Free-tier Gemini inputs may be used by Google to improve its products. Only use photos of yourself or people who agreed.
- AI output can be wrong. Treat the risk level as a hint.
- No keys or tokens are stored in this repo.

## Limitations

- Ring events are simulated.
- The visitor log is in memory and resets when the server restarts.
- Live camera frames are not sent to the AI yet; the starter has a video stream but no snapshot endpoint.
