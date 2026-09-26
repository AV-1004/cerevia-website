# CEREVIA website

This is the Vite + React website version of the supplied CEREVIA dashboard prototype.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints, normally `http://localhost:5173/`.

## Build for hosting

```bash
npm run build
npm run preview
```

## Important

The supplied dashboard contains browser-side calls to Anthropic for AI grading/note generation. Those calls are preserved from the prototype; for a public deployment, move the AI calls to a server/backend and keep the API key off the client.
