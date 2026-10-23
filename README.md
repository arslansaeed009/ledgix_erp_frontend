# MACHINE HOME — ERP & Ledger Management System

A complete, local-first business management system for MACHINE HOME (industrial compressors, service station lifts, and related equipment).

**Status: All 6 phases complete.** Customers, Products & Inventory, Quotations, Invoices, Payments, Ledger, Expenses, Suppliers & Purchases, Reports, Global Search, PDF generation, and WhatsApp sharing are all built and functionally tested end-to-end.

## Stack
- **Backend:** Node.js, Express, SQLite (better-sqlite3) — a single local database file, no server installation needed
- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide icons
- **Auth:** JWT + bcrypt, single Admin account created via a one-time setup wizard
- **PDF:** Puppeteer — generates branded invoice/quotation/receipt/ledger-statement PDFs with your logo, stamp, and signature

## First-time setup

### 1. Backend
```bash
cd backend
npm install
npm start
```
This creates `backend/data/machinehome.db` automatically (empty — no demo data) and starts the API on `http://localhost:4000`.
The first `npm install` also downloads a bundled Chromium for Puppeteer (needed for PDF generation) — this requires an internet connection and may take a minute or two the first time only.

### 2. Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Create your Admin account
The first time you open the app, you'll see a one-time **Setup** screen. Enter your name, email, and password — this becomes your only login.

## What's included

- **Customers (CRM):** full profile, credit limit, opening balance, documents, complete history
- **Products & Inventory:** categories, images, warehouses, stock in/out/adjustment/transfer, low-stock alerts, full audit trail
- **Quotations:** line items, discounts, tax, PDF, WhatsApp share, duplicate, convert to invoice
- **Invoices:** direct or from quotation, automatic stock deduction, ledger posting, PDF, WhatsApp share, cancellation with stock/ledger reversal
- **Payments:** against an invoice or as a general advance, multiple methods, auto invoice-status updates (pending → partial → paid)
- **Ledger:** automatic running balance per customer, company-wide overview, filtered statements, PDF export
- **Expenses:** categorized tracking (fuel, salary, rent, etc.)
- **Suppliers & Purchases:** supplier CRM, purchase invoices with automatic stock-in, supplier ledger, supplier payments
- **Reports:** sales, customers, profit & loss, expenses, stock valuation, purchases, tax/GST, outstanding balances, best-selling products — with Excel export
- **Global Search:** across customers, products, invoices, quotations, payments, and suppliers
- **Dashboard:** live KPIs, charts, low-stock alerts, notifications bell

## Notes on integrations
- **WhatsApp:** Uses `wa.me` deep links (opens WhatsApp Web/App with a pre-filled message). WhatsApp does not allow any web app to auto-attach a file through this method — after downloading a PDF, attach it manually in the chat that opens. Real automatic delivery requires Meta's official WhatsApp Business API, which needs business verification (1–4 weeks). Let me know if you'd like that wired in later.
- **Email:** Not connected — "Forgot password" shows the reset token directly on-screen since no SMTP account is configured. Give me an SMTP login (Gmail app password or company mail) whenever you want real email sending.
- **Backups:** The entire system is one file — `backend/data/machinehome.db`. Copy that file anywhere to back up or move your data. Uploaded images/documents live in `backend/uploads/`.
- **Purchase Orders:** The backend supports draft purchase orders (before the supplier bills you), but only the Purchase Invoice flow (the actual bill) has a frontend screen right now, since that's what most small operations need day-to-day. Ask if you'd like a dedicated PO screen too.

## Project structure
```
backend/src/
  db/        → schema.sql (all tables), migrate.js, index.js
  routes/    → one file per module (customers, products, quotations, invoices, payments, ledger, expenses, suppliers, purchases, reports, search, pdf, notifications, settings, auth)
  middleware/→ JWT auth guard
  utils/     → document numbering, ledger posting, line-item calculations, PDF HTML templates
frontend/src/
  pages/     → one screen per module
  layouts/   → AppShell (sidebar + topbar + notifications)
  components/→ shared UI primitives + LineItemsEditor (shared by quotations/invoices/purchases)
  lib/       → API client, auth context, formatting helpers
```
