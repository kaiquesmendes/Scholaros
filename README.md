# ScholarOS 🎓

A full-stack academic productivity platform combining an AI-powered essay grader/formatter, AI document processing (summaries, flashcards, and quiz generation from PDFs), a real-time social feed for students, study groups, and a gamification system (XP, levels, streaks, badges).

**🔗 Live demo:** [scholaros-ecru.vercel.app](https://scholaros-ecru.vercel.app/)
**📦 Repository:** [github.com/kaiquesmendes/Scholaros](https://github.com/kaiquesmendes/Scholaros)

## Overview

ScholarOS is a study platform built for university and ENEM (Brazilian college entrance exam) students. It goes beyond static study tools by combining an AI backend (Google Gemini) with a real-time social layer (Firestore) and a full gamification loop, all behind authenticated, rate-limited API routes.

## Features

- **AI Essay Editor** — writes and grades essays in ENEM, university, or thesis (TCC) mode, with score breakdown by competence, strengths/improvements feedback, an ABNT auto-formatter, and optional "professor mode," "humanizer," and "expansion" passes
- **AI PDF processing** — upload a PDF and get an AI-generated summary, flashcards, multiple-choice questions, and a mind map extracted from the content
- **Real-time social feed** — global chat, posts with likes/comments, user search, and a follow system, all live via Firestore listeners
- **Study groups** — create/join groups with group chat and member management
- **Gamification** — XP, levels, streaks, and a badge system tied to real usage (essays written, PDFs processed, study hours logged)
- **Dashboard** — subject progress, weekly goals, and productivity overview
- **Authentication** — email/password, Google, and GitHub sign-in via Firebase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express |
| AI | Google Gemini API (`@google/generative-ai`) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (email, Google, GitHub) |
| File uploads | Multer + `pdf-parse` |
| Deployment | Frontend on Vercel, backend on Render |

> Earlier drafts of this README referenced OpenAI and Supabase — those were planning-stage options that were **not** what got built. The table above reflects what's actually in the codebase.

## Security

The AI routes call a paid, rate-limited external API, so they're protected server-side:

- **Authentication:** every `/api/essay/*`, `/api/pdf/*`, and `/api/chat` request must include a valid Firebase Auth ID token (`Authorization: Bearer <token>`), verified server-side with the Firebase Admin SDK. Unauthenticated requests are rejected with `401`.
- **Rate limiting:** AI routes are capped per IP/session (`express-rate-limit`) to prevent quota abuse even from authenticated users.
- **Security headers:** `helmet` is applied globally.

Known gap I'm still closing: Firestore security rules need a full audit to make sure users can only read/write their own data (posts, group messages, and profile documents) at the database level, not just through app-side checks. Tracked in [Roadmap](#roadmap--known-limitations) below.

## Running Locally

**Backend**
```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=10000
GEMINI_API_KEY=your_gemini_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="your_service_account_private_key"
```
> `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` come from a Firebase service account JSON (Firebase Console → Project Settings → Service Accounts → Generate new private key). This is required for the backend to verify user auth tokens.

```bash
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:10000
```

```bash
npm run dev
```

## Roadmap / Known Limitations

Being upfront about what's next:

- [ ] Audit and lock down Firestore security rules for posts, group chats, and user documents
- [ ] Restrict CORS on the backend to the actual frontend origin instead of allowing all origins
- [ ] Split `server.js` into proper `routes/` / `controllers/` / `services/` layers as the API surface grows
- [ ] Automated tests for the essay-grading and PDF-processing pipelines
- [ ] CI (GitHub Actions) to run lint/tests on every push

## License

This project is for portfolio purposes.
