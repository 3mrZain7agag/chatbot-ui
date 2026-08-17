# Chatbot UI

A React + Express chatbot that automatically detects whether you want a text reply or an AI-generated image — all from a single chat interface.

## How it works

Every message you send goes to a single backend endpoint (`/api/message`), which:

1. Uses a free text model to classify your intent as either `chat` or `image`
2. Routes to the appropriate model:
   - **Chat** → replies with text
   - **Image** → generates and returns an image

No need to pick a mode manually — just type naturally (e.g. "how are you?" vs "draw a cat wearing sunglasses").

## Tech stack

- **Frontend:** React (Vite)
- **Backend:** Express (Node.js)
- **Text generation:** [OpenRouter](https://openrouter.ai) — model: `dots-studio/dots-3-note-preview:free`
- **Image generation:** [Hugging Face Inference API](https://huggingface.co) — model: `stabilityai/stable-diffusion-3-medium-diffusers`

Both models are free-tier. Note: free model availability on OpenRouter changes over time — if the chat route stops responding, check [openrouter.ai/models](https://openrouter.ai/models) for a currently available `:free` model and swap it in `server/index.js`.

## Project structure

```
chatbot-ui/
├── src/            # React frontend
├── server/         # Express backend
│   ├── index.js    # API routes (/api/message, /api/chat, /api/image)
│   └── .env        # API keys (not committed)
└── ...
```

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/3mrZain7agag/chatbot-ui.git
   cd chatbot-ui
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

4. Create `server/.env` with your API keys:
   ```
   OPENROUTER_API_KEY=your_openrouter_key_here
   HUGGINGFACE_API_KEY=your_huggingface_key_here
   ```

   - Get an OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys)
   - Get a Hugging Face token (Read access) at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

## Running the app

You'll need two terminals running at the same time:

**Terminal 1 — Backend:**
```bash
cd server
node index.js
```
Runs on `http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
npm run dev
```
Runs on `http://localhost:5173` (or the port Vite assigns)

> **Note:** If running in GitHub Codespaces, make sure port 3001 is set to **Public** visibility in the Ports tab, and update the fetch URL in `src/App.jsx` to use the forwarded Codespaces URL for port 3001 instead of `localhost:3001`.

## API endpoints

| Route | Method | Description |
|---|---|---|
| `/api/message` | POST | Main endpoint — classifies intent and routes to chat or image generation |
| `/api/chat` | POST | Direct text chat via OpenRouter |
| `/api/image` | POST | Direct image generation via Hugging Face |

## Notes on free-tier limits

- Chat responses are capped at 150 completion tokens to conserve free quota
- Only the last 6 messages of conversation history are sent per request
- Model "reasoning" output is disabled (`reasoning: { enabled: false }`) to keep responses concise and avoid wasting tokens on visible chain-of-thought
