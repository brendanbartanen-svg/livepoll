# LivePoll

Real-time classroom polling app. A lightweight PollEverywhere alternative for ~30–100 participants.

Live at: https://livepoll-ten.vercel.app

## Tech Stack

- **Frontend**: React 19 + Vite 7, react-router-dom (client-side routing)
- **Database**: Firebase Firestore (real-time sync via `onSnapshot`)
- **Hosting**: Vercel (static SPA deploy)
- **Charts**: Recharts (used for nothing yet — ResultsChart is hand-rolled CSS bars)

No backend server. The React app talks directly to Firestore from the browser.

## Project Structure

```
livepoll/
├── index.html                 # Entry point
├── package.json
├── vite.config.js
├── vercel.json                # SPA rewrite rule (all routes → index.html)
├── firestore.rules            # Firestore security rules (currently wide-open MVP)
├── src/
│   ├── main.jsx               # App shell, BrowserRouter, route definitions
│   ├── styles.css             # All styles (CSS custom properties, no CSS modules)
│   ├── lib/
│   │   └── firebase.js        # Firebase init + all Firestore CRUD functions
│   └── components/
│       ├── Home.jsx           # Landing page: create session or join by code
│       ├── Presenter.jsx      # Presenter dashboard: manage questions, view results
│       ├── Participant.jsx    # Participant view: answer active question
│       └── ResultsChart.jsx   # Horizontal bar chart (counts + percentages)
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Home | Create a new session or join with a 4-char room code |
| `/present/:roomCode` | Presenter | Manage questions, activate/deactivate, show results |
| `/join/:roomCode` | Participant | See active question, select options, submit response |

## Firestore Data Model

```
rooms/{roomCode}
  ├── createdAt: timestamp
  ├── activeQuestionId: string | null
  ├── showResults: boolean
  ├── status: "open" | "closed"
  │
  └── questions/{questionId}
        ├── text: string
        ├── type: "single" | "multi"
        ├── options: string[]
        ├── createdAt: timestamp
        ├── order: number
        │
        └── responses/{participantId}
              ├── selectedOptions: string[]
              └── submittedAt: timestamp
```

Room codes are 4 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no ambiguous chars like 0/O, 1/I/L).

## Key Firebase Functions (src/lib/firebase.js)

All Firestore operations are in `firebase.js`. The main exports:

- `createRoom()` → generates unique room code, writes room doc
- `getRoom(code)` → one-time fetch of room doc
- `subscribeToRoom(code, cb)` → real-time listener on room doc
- `updateRoom(code, data)` → partial update (activeQuestionId, showResults, etc.)
- `addQuestion(code, data)` → add question subcollection doc
- `subscribeToQuestions(code, cb)` → real-time listener on questions subcollection
- `deleteQuestion(code, qId)` → delete question doc
- `submitResponse(code, qId, participantId, selections)` → write response doc
- `subscribeToResponses(code, qId, cb)` → real-time listener on responses subcollection

## Firebase Project

- Project: `livepoll-817c0`
- Console: https://console.firebase.google.com/project/livepoll-817c0
- Plan: Spark (free tier)
- Security rules: currently permissive MVP rules (wide open read/write). Need to be tightened before any real use beyond prototyping.

## Development

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server at localhost:5173
npm run build      # production build to dist/
```

## Deploying

Deployed via Vercel CLI (not connected to GitHub CI):

```bash
npx vercel --prod
```

This builds and deploys to https://livepoll-ten.vercel.app. The `vercel.json` rewrites all routes to `index.html` for SPA client-side routing.

## Known Limitations & Future Work

- **No authentication**: anyone with the room code can do anything. There's no presenter auth — the presenter URL is the only access control.
- **Firestore security rules are wide open**: the `firestore.rules` file has proper structure but allows all reads/writes. Before real classroom use, add rules that restrict write access (e.g., only the session creator can manage questions).
- **Test mode expiration**: Firestore was set up in test mode, which expires 30 days after creation. Deploy proper rules before then via Firebase CLI (`firebase deploy --only firestore:rules`).
- **No session cleanup**: old rooms accumulate in Firestore forever. Consider a TTL or manual cleanup.
- **Participant IDs are session-based**: stored in `sessionStorage`, so they reset if the tab is closed. This means a user could vote twice by reopening the tab.
- **No edit-in-place for questions**: questions can only be created or deleted, not edited after creation.
- **recharts is installed but unused**: ResultsChart uses hand-rolled CSS bars. Could swap to recharts if richer chart features are needed.
- **GitHub repo exists but code isn't pushed**: https://github.com/brendanbartanen-svg/livepoll exists but is empty. Need to set up SSH keys or a PAT with `repo` scope to push.

## Style Conventions

- Functional components with hooks (no class components)
- All styles in a single `styles.css` file using CSS custom properties (e.g., `var(--primary)`)
- No TypeScript, no CSS modules, no state management library — kept deliberately simple
- Firebase logic isolated in `src/lib/firebase.js`, components import from there
