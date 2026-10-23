cd ~/seebell

cat > README.md << 'EOF'
# SeeBell: a doorbell you can see

SeeBell makes the front door accessible for deaf and hard-of-hearing people. When someone rings, the whole screen flashes, the text is huge, the phone vibrates, and an AI tells you who is outside and how risky it looks. You reply with one tap, and the visitor sees your answer in big text on a door display.

Built for the **Amazon Developer Hackathon, Ring track** (accessibility category).

![SeeBell alert](docs/alert.png)

## Features

- **Full-screen visual alert**: flashing green, amber or red by risk level, huge text, phone vibration, and an aria-live alert dialog for screen readers.
- **AI visitor description**: Google Gemini looks at a camera frame and returns who is there, whether they carry a package, a risk level with a reason, and a suggested reply.
- **One-tap replies**: Coming, Leave at door, Not now. The suggested one is highlighted.
- **Door display (`/door`)**: shows your reply in big text for the visitor, updating live.
- **Visitor log**: timeline with snapshots, AI descriptions and your replies.
- **Daily summary**: today's visitors counted in code, then summarized by Gemini in two sentences.
- **Ring API check**: a panel that calls the Ring API and lists your Ring device.

![Home](docs/home.png)
![Door display](docs/door.png)
![Log and summary](docs/log-summary.png)

## Honest note about the demo

The Ring Developer Playground has no real doorbell-press events, no working webhooks in token mode, and no talk-back. So **the doorbell press is simulated** with a button. The Ring API call, the AI analysis, the alert, the replies, the log and the summary are all real. Photos are uploaded to stand in for a camera frame.

## Tech

Next.js 15 (App Router), TypeScript, Tailwind CSS, Ring API, Google Gemini API.

## What's new vs Amazon's starter

This project starts from Amazon's MIT-licensed `ring-api-helloworld` starter. Everything below was added during the hackathon:

- `lib/seebell.ts`: types, mock scenarios, reply actions, in-memory store
- `lib/gemini.ts`: Gemini vision call with a strict JSON contract, validation and fallback
- `app/api/simulate-ring`: simulated ring (mock scenario or photo + real AI)
- `app/api/state`, `app/api/action`: live state and reply handling
- `app/api/summary`: daily summary
- `app/seebell/page.tsx`: alert screen, controls, visitor log, summary
- `app/door`: visitor-facing door display
- `components/RingPanel.tsx`: Ring API device check

The starter's own Ring code (`app/api/ring/*`, `lib/auth.ts`) is kept and used.

## Setup

1. Clone and install:

   ```bash
   git clone https://github.com/Sindhu0012/seebell.git
   cd seebell
   npm install
   ```

2. Copy the env file and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   - `RING_ACCESS_TOKEN`: from the Ring Developer Playground (expires every 30 minutes).
   - `GEMINI_API_KEY`: a free key from https://aistudio.google.com/apikey
   - `GEMINI_MODEL=gemini-3.8-flash`
   - Optional: `AI_MOCK=true` to run without calling Gemini.

3. Run it:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000/seebell. Open http://localhost:3000/door in another tab for the visitor display.

5. Click a **Simulate** button, or **Ring with a photo (real AI)**.

Without a Gemini key the app still works in demo mode with canned answers.

## Limitations

- Ring events are simulated (see the note above).
- The visitor log is stored in memory and resets when the server restarts.
- AI output is a description of what is visible. It never guesses names or identities, and it can be wrong, so treat the risk level as a hint.

## License

MIT. See [LICENSE](LICENSE).
EOF

if ! ls LICENSE* >/dev/null 2>&1; then
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Sindhu Adepu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
echo "LICENSE created"
else
echo "LICENSE already exists, left alone"
fi

git add .
git commit -m "Add README and LICENSE"
git push
echo done
