# HireLocal AI

AI-powered home services app: describe or photograph a problem, get a DIY guide or matched with verified local workers.

## Setup

1. Clone the repository.
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Add your **Gemini** and **Firebase** credentials to `.env` (never commit this file).
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```
5. (Optional) Seed demo workers into Firestore:
   ```bash
   npm run seed:workers
   ```

## Environment variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (server-only) |
| `FIREBASE_*` | Firebase project config (server-only) |

See [.env.example](.env.example) for the full list.

## Security (public repository)

- **`.env` is gitignored** — do not remove it from `.gitignore`.
- If `.env` was ever committed, run: `git rm --cached .env` and rotate all API keys.
- **Rotate keys** in [Google AI Studio](https://aistudio.google.com/apikey) and [Firebase Console](https://console.firebase.google.com/) before publishing.
- Restrict Firebase with [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started) in production.

## Tech stack

- React + TanStack Router / Start
- Google Gemini 1.5 Flash (analysis)
- Firebase Firestore (workers)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run seed:workers` | Add demo workers to Firestore |
