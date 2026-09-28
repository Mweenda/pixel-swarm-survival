<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Pixel Swarm Survival

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bad192e6-5e3b-4cb1-b491-3abde8040c8c

## Run Locally

**Prerequisites:** Node.js 20+, pnpm, and Java (required by the Firestore emulator).

Install dependencies with `pnpm install`.

Set `VITE_FIREBASE_API_KEY` in an ignored `.env.local` file before running or building the app. The Firebase web API key is included in browser builds, so restrict it to the app's domains and required APIs in Google Cloud Console.

Start the local Firebase Auth and Firestore backend with `pnpm run backend`. The first run downloads the emulator binaries. The Firebase Emulator UI is available at http://localhost:4000.

In a second terminal, run the frontend against those emulators with `pnpm run dev:emulator`; Vite is available at http://localhost:3000. To use the deployed Firebase services instead, run `pnpm run frontend`.

## Build and Deploy

Run `pnpm run build` to create the production frontend in `dist/`. `pnpm run deploy` deploys that build to the configured Firebase Hosting site (`pixel-swarm-survival`). Firebase CLI authentication and project access are required. This command publishes to the live site.
