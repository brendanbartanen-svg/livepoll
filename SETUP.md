# LivePoll — Setup & Deployment Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → give it a name (e.g., "livepoll") → create
3. In the project dashboard, click the **web icon** `</>` to add a web app
4. Register the app (no need to enable Firebase Hosting)
5. Copy the `firebaseConfig` object from the setup screen

## 2. Configure the App

Open `src/lib/firebase.js` and replace the placeholder config:

```js
const firebaseConfig = {
  apiKey: 'your-actual-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
}
```

## 3. Enable Firestore

1. In the Firebase Console, go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (or production mode with the rules below)
4. Select a region close to you (e.g., `us-central1`)

### Firestore Security Rules

In the Firebase Console under Firestore → Rules, paste the contents of `firestore.rules` from this project. The included rules are permissive for MVP use — you'll want to add authentication before using this at scale.

## 4. Run Locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Open it to create a poll session.

## 5. Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel auto-detects Vite — no config needed
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`.

**That's it.** Share the URL with your class. You create polls from the presenter view; students join with the 4-character room code on their phones.

## Architecture Overview

```
/                   → Home page (create session or join with code)
/present/ABCD       → Presenter view (create questions, control flow, see results)
/join/ABCD          → Participant view (answer questions on phone/laptop)
```

**Data model (Firestore):**
```
rooms/{roomCode}
  ├── activeQuestionId: string | null
  ├── showResults: boolean
  └── questions/{questionId}
        ├── text: string
        ├── type: "single" | "multi"
        ├── options: string[]
        └── responses/{participantId}
              └── selectedOptions: string[]
```

## Future Enhancements

- **Authentication**: Add Firebase Auth so only the presenter can control questions
- **Timer**: Auto-close questions after N seconds
- **Export**: Download response data as CSV
- **Word clouds**: Add free-response question type
- **Themes**: Custom branding per session
