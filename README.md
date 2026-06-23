# BG Analysis — FastAPI Backend

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
```

## Run locally

```bash
uvicorn main:app --reload
```

## Deploy (Railway / Render)

1. Push this `backend/` folder as your repo root (or set root directory to `backend/`)
2. Set environment variables: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. Railway auto-detects Python — start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /jobs | Create a match job |
| GET | /jobs?email=... | List jobs by email |
| GET | /jobs/{id} | Get single job |
| PATCH | /jobs/{id} | Update job status/result |
| POST | /checkout | Create Stripe checkout session |
| POST | /checkout/webhook | Stripe webhook handler |
| GET | /health | Health check |

## After deploying

Update `VITE_API_BASE_URL` in the frontend to your deployed URL, e.g.:
```
VITE_API_BASE_URL=https://your-api.railway.app
``