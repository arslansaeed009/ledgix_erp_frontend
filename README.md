# Ledgix ERP Frontend

The React web application for Ledgix ERP. It provides the user interface for company workspaces, sales, inventory, purchasing, payments, and reporting. Business data and authentication are provided by the separately deployed Ledgix ERP API.

## Features

- Company signup, login, workspace branding, and dark mode
- Customer and supplier records, balances, and ledgers
- Products, categories, inventory movements, and low-stock alerts
- Quotations, invoices, payments, and sales returns
- Purchase invoices and supplier payments
- Dashboard, global search, and business reports
- PDF documents and selected Excel exports
- WhatsApp share links in supported screens; invoice details do not include a WhatsApp action

Some capabilities have limitations; see [FEATURE_STATUS.md](./FEATURE_STATUS.md) for what is ready, partial, or planned.

## Technology

- React 19 and React Router
- Vite
- Tailwind CSS
- Axios
- Recharts and Lucide icons

## Requirements

- Node.js and npm
- The Ledgix ERP backend/API, available either locally or at a deployed URL

## Local development

From the repository root:

```bash
npm install
npm run dev
```

By default, the frontend sends API requests to `http://localhost:4000/api`. To use another API, create a `.env` file in the repository root and set:

```env
VITE_API_URL=http://localhost:4000/api
VITE_APP_URL=http://localhost:5173
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Sign up or log in using an account served by the backend.

## Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL; include `/api` | `http://localhost:4000/api` |
| `VITE_APP_URL` | Public frontend URL | Current browser origin |

These are frontend build-time variables and must use the `VITE_` prefix. Do not put backend secrets in frontend environment variables; values prefixed with `VITE_` are included in the browser build.

For the currently deployed environment, see [ENV_SETUP.md](./ENV_SETUP.md). Update host environment variables and redeploy after changing frontend `VITE_*` values.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create the production frontend build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

## Deployment

The frontend is deployed on Netlify at [ledgixerp.netlify.app](https://ledgixerp.netlify.app), and uses the API hosted on Railway. Production API and app URLs are configured in [netlify.toml](./netlify.toml) and [ENV_SETUP.md](./ENV_SETUP.md). Ensure the backend allows the deployed frontend origin.

## Project layout

```text
src/
  components/   Shared UI components
  hooks/        Reusable React hooks
  layouts/      Authenticated application shell
  lib/          API client, auth/company context, config, and utilities
  pages/        Application screens and workflows
public/         Static public assets
```

The backend and database are not part of this frontend repository. Backend setup, database backups, and server-side configuration must be handled in the backend deployment.
