<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Pixel Swarm Survival

Pixel Swarm Survival is a browser-based survival game built with React, Vite, and Firebase.

View your app in AI Studio: https://ai.studio/apps/bad192e6-5e3b-4cb1-b491-3abde8040c8c

## Set Up After Pulling `main`

Prerequisites: Node.js 20+, pnpm, and Java (required only for the Firebase emulators).

Clone the repository, or update an existing checkout:

```sh
git clone <repository-url>
cd pixel-swarm-survival
git pull origin main
pnpm install
```

Create an ignored `.env.local` in the project root and set the Firebase Web API key:

```dotenv
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
```

The key is included in the browser build, so restrict it to the app's domains and required APIs in Google Cloud Console. Do not commit `.env.local`.

### Local Emulator Mode

For isolated development, start the Firebase Auth and Firestore emulators in one terminal:

```sh
pnpm run backend
```

The first run downloads emulator binaries. In a second terminal, start Vite against the emulators:

```sh
pnpm run dev:emulator
```

Open http://localhost:3000. The Firebase Emulator UI is available at http://localhost:4000. Emulator data is local and separate from the shared production database.

### Use the Shared Firebase Project

To run locally against the deployed Firebase services, use:

```sh
pnpm run frontend
```

This uses the shared Firebase project and can read or write real player data. Contributors need Firebase Authentication enabled and appropriate project access to sign in or deploy.

## Build and Deploy

Authenticate the Firebase CLI and make sure your account has access to the `pixel-swarm-survival` project:

```sh
pnpm exec firebase login
pnpm exec firebase projects:list
```

Build and deploy both Firestore rules and the Hosting site:

```sh
pnpm run build
pnpm exec firebase deploy --only firestore,hosting --project pixel-swarm-survival
```

This publishes to the shared production database and site at https://pixel-swarm-survival.web.app. Only run the deployment command when you are authorized to update that Firebase project. `pnpm run deploy` deploys Hosting only; use the command above when Firestore rules also need to be published.
