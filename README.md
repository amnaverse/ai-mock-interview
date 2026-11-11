# AI Mock Interview Coach

Practice technical interviews and get instant, honest feedback. Pick a role and difficulty, answer 5 AI-generated questions, and receive a score, strengths, improvements and a sample answer after every response, plus a summary at the end.

**Live demo:** https://ai-mock-interview-kayp.vercel.app

![Setup screen](./screenshots/setup.png)

## Features

- Choose a role (MERN Intern, Frontend, Backend, Full Stack) and a difficulty (easy, medium, hard)
- 5 AI-generated interview questions per session, with no repeated questions
- Instant feedback on every answer: score out of 10, strengths, areas to improve and a better sample answer
- End-of-session summary with average score, weak topics and next steps
- Past interviews saved in the browser so you can track your progress
- Responsive, dark UI

## Tech stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Deployment:** Vercel (frontend and backend as two separate projects)

## How it works

1. The frontend sends the chosen role and difficulty to the backend.
2. The backend builds a prompt and calls the Gemini API to generate a question.
3. After the user answers, the backend asks the model for structured JSON feedback, validates and cleans it, then returns it to the UI.
4. At the end, all scores and improvement points are sent for a short coaching summary.

## API endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/question` | Generate one interview question |
| POST | `/api/feedback` | Score and review an answer |
| POST | `/api/summary` | Generate the end-of-session summary |

## Security and reliability

- Input validation and length limits on every route
- Rate limiting (20 requests per minute per IP)
- Prompts treat user answers as data, not instructions (prompt-injection-aware)
- Model output is parsed and sanitised before it reaches the UI
- API key is kept in server-side environment variables only
- CORS restricted to the deployed frontend URL

## Run locally

### 1. Clone the repo

```bash
git clone https://github.com/amnaverse/ai-mock-interview.git
cd ai-mock-interview
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env` (see `.env.example`):

```
AI_API_KEY=your_gemini_api_key
AI_MODEL=your_gemini_model_name
CLIENT_URL=http://localhost:5173
PORT=5000
```

Start it:

```bash
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:5000
```

Start it:

```bash
npm run dev
```

Open http://localhost:5173

## Deployment (Vercel)

The repo is a monorepo, so it is deployed as two Vercel projects from the same GitHub repo:

| Project | Root Directory | Environment variables |
|---|---|---|
| Backend | `server` | `AI_API_KEY`, `AI_MODEL`, `CLIENT_URL` |
| Frontend | `client` | `VITE_API_URL` |

The Express app is exported from `server/index.js` and wrapped in a serverless function at `server/api/handler.js`. A rewrite in `server/vercel.json` routes all requests to it.

## What I learned

- Running an Express API as a Vercel serverless function
- Debugging CORS, environment variables and deployment protection across two deployed apps
- Getting reliable structured JSON out of an LLM and validating it
- Designing safe, rate-limited API endpoints

## Future improvements

- User accounts and saved history in a database
- Voice answers
- More roles and question topics
- Timed interview mode

## Author

**Amna Ishaq**
[GitHub](https://github.com/amnaverse) | [LinkedIn](https://www.linkedin.com/) | amna16528@gmail.com
