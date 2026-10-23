# Environment & go-live settings — Ledgix ERP

All credentials and domain URLs are controlled by **environment variables**.  
Do **not** hardcode production secrets in source files.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Netlify) | https://ledgixerp.netlify.app |
| Backend (Railway) | https://ledgix-backend-production.up.railway.app |
| API base | https://ledgix-backend-production.up.railway.app/api |
| Health check | https://ledgix-backend-production.up.railway.app/api/health |

---

## Local development

### Backend
```bash
cd backend
cp .env.example .env
npm start
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm run dev
```

---

## Production variables (copy into host dashboards)

### Railway (backend) — Variables

```env
NODE_ENV=production
PORT=4000
JWT_SECRET=replace-with-strong-random-secret
FRONTEND_URL=https://ledgixerp.netlify.app
APP_URL=https://ledgixerp.netlify.app
BACKEND_URL=https://ledgix-backend-production.up.railway.app
```

Railway networking:
- Public domain: `ledgix-backend-production.up.railway.app`
- Target port: `4000`

### Netlify (frontend) — Environment variables

```env
VITE_API_URL=https://ledgix-backend-production.up.railway.app/api
VITE_APP_URL=https://ledgixerp.netlify.app
```

Netlify build:
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

> After changing `VITE_*` vars, **redeploy** the Netlify site.

---

## Where code reads these values

| Setting | File |
|---------|------|
| Backend secrets / CORS / URLs | `backend/src/config.js` |
| Frontend API URL | `frontend/src/lib/config.js` |
| Axios base URL | `frontend/src/lib/api.js` |
| Upload/asset URLs | `frontend/src/lib/CompanyContext.jsx` |

---

## Database note

Today the app still uses SQLite file: `backend/data/machinehome.db`  
`DATABASE_URL` is reserved for a future Postgres switch. Leave it empty for now.
