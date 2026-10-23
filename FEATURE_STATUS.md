# Feature Status — Sales Readiness Guide

Use this file when selling the ERP to companies.  
It tells you **what is real and ready**, **what is partial**, **what is hardcoded/dummy**, and **what is future work**.

> **Quick rule for sales talks:**  
> Sell the **Realtime / Ready** modules with confidence.  
> Disclose **Partial** items honestly.  
> Do **not** claim **Hardcoded** or **Future** items as finished features.

---

## How to read this document

| Status | Meaning | Safe to sell as… |
|--------|---------|------------------|
| **Realtime / Ready** | Live data from database + API, end-to-end for each company | Production feature |
| **Partial / Improve** | Works, but incomplete or limited | Demo + roadmap |
| **Hardcoded / Dummy** | Static list, placeholder, or leftover demo behavior | Needs improvement before claiming |
| **Future enhancement** | Not built yet | Roadmap only |

---

## 1. Realtime / Ready (good for company sales)

These modules are **working with real database data**. Each new signup gets an **isolated company workspace** (own customers, products, invoices, branding, reports).

### Company & access
- **Signup / Login** — each new email creates its own company (Admin)
- **Multi-company isolation** — Company A cannot see Company B’s data
- **Company branding** — name, tagline, logo, stamp, signature, address, phone, email, NTN/STRN
- **Document numbering** — per-company invoice/quotation/receipt/purchase/return numbers
- **Dark mode** — works in the UI (Settings + header toggle)

### Sales & customers
- **Customers** — add, edit, delete, search, documents, balances
- **Quotations** — create, edit, status, convert to invoice
- **Invoices / Bills** — create, edit, cancel/delete, stock deduction, customer ledger
- **Payments (Receiving)** — record customer payments, methods, receipt PDF
- **Customer ledger** — running balance + statement PDF
- **Sales returns** — record returns, restore stock, credit customer ledger

### Inventory & products
- **Products** — CRUD, pricing, tax, images, SKU
- **Categories** — create/manage per company
- **Inventory** — stock in/out/adjust/transfer, movement history, low-stock alerts
- Stock auto-updates from invoices, purchases, and sales returns

### Purchases & suppliers
- **Suppliers** — add, edit, delete (cascades related records)
- **Purchases** — purchase invoices with items, quantities, prices, dates
- Auto stock increase on purchase
- Supplier payments + supplier ledger

### Dashboard & reports
- **Dashboard** — live KPIs (sales, collections, purchases, outstanding, charts)
- **Reports** (period filters: daily / weekly / monthly / yearly):
  - Monthly Business Summary
  - Sales Report
  - Purchase Report (value + quantity by product)
  - Receiving Report (customer payments / cash inflow)
  - Sales Returns Report
  - Customers, Profit, Expenses, Stock, Tax, Outstanding, Best Selling
- **Excel export** — sales, customers, stock, outstanding, expenses

### Documents & extras
- **PDF** — quotation, invoice, receipt, ledger (company letterhead)
- **WhatsApp share links** — opens WhatsApp with a prefilled message (manual send)
- **Global search** — customers, products, invoices, quotations, payments, suppliers
- **Expenses** — create / edit / delete expense records (real DB)

---

## 2. Partial / Needs improvement (works, but tell buyers the limit)

| Area | What works today | What still needs improvement |
|------|------------------|------------------------------|
| **User roles** | Role is saved on the user (Admin, Manager, etc.) | Roles are **not enforced**. Every logged-in user can do everything in their company. No invite-team UI. |
| **Password reset** | Reset token is generated | **No email server**. Token is shown on screen, not emailed. |
| **Purchase Orders (PO)** | Backend API exists | **No PO screen in the UI**. Users create purchase invoices directly. |
| **Sales returns vs invoice balance** | Stock + ledger credit work | Does **not** automatically reduce the original invoice balance like a full credit note. |
| **Notifications bell** | Shows overdue invoices, low stock, expiring quotes | Not saved to DB; no “mark as read” history. |
| **Excel export** | 5 report types export | Purchases, Receiving, Returns, Profit, Tax, Monthly Summary are **view-only** (no Excel yet). |
| **Warehouses** | Default warehouse + transfer action | Stock is still mainly one quantity per product (not full multi-warehouse qty). |
| **New company categories** | Empty categories until user adds them | Old default company may still have Machine Home–style seeded categories. |
| **PDF generation** | Works when Chrome/Edge is installed | Needs a system browser for Puppeteer; may fail on servers without Chrome. |
| **Database** | SQLite file, fine for SMB / single server | Not built for heavy multi-server cloud scale yet. |

---

## 3. Hardcoded / Dummy / Placeholder (improve before selling as “complete”)

| Item | Reality |
|------|---------|
| **Expense categories** | Fixed list in code (Fuel, Rent, Salary, etc.) — not editable per company in Settings. |
| **Legacy product categories** | Older installs may include hardcoded industrial categories (compressors, lifts, etc.) from early Machine Home seed data. |
| **Machine Home leftovers** | Some internal names remain: DB file `machinehome.db`, JWT default secret, localStorage keys `mh_*`. Branding UI itself is generic. |
| **Login branding** | Before login, company logo/name is empty by design (multi-tenant). Branding appears after sign-in. |
| **Roles on signup** | Later signups used to become “Employee”; now each signup is Admin of a **new** company. Role names exist but are mostly unused. |
| **Favorites table** | Exists in database schema only — **no UI / no feature**. |
| **Notifications table** | Exists in schema — runtime notifications are generated live, not stored. |
| **WhatsApp** | Link opener only — **not** WhatsApp Business API / automatic PDF send. |

---

## 4. Future enhancements (roadmap — not built)

Good talking points as “next version,” not current delivery:

- Invite multiple users into the **same** company + real role permissions  
- Email sending (password reset, invoice/quotation email with PDF)  
- Purchase Order UI (create PO → receive against PO)  
- True credit notes that adjust invoice balances  
- Per-warehouse stock quantities  
- Full accounting (chart of accounts, bank reconciliation)  
- Barcode / POS mode  
- Recurring invoices  
- Activity/audit log screen  
- Pakistan FBR / e-invoicing integration  
- Multi-currency exchange rates  
- Excel export for **all** report tabs  
- CSV import (customers / products)  
- Company-configurable expense categories  
- WhatsApp Business / email document delivery  
- Hosted SaaS ops (Postgres, backups, HTTPS, secrets management)  
- Mobile app  

---

## 5. What you can safely say to buyers

### Strong sales pitch (true today)
> “Each company signs up and gets its own private ERP: branding, customers, products, quotations, invoices, payments, purchases, inventory, sales returns, dashboard, and business reports — all live from the database, not demo data.”

### Honest limitations (say upfront)
> “Team roles, email delivery, and purchase-order screens are on the roadmap. Password reset works without email (token shown in app). WhatsApp is a share link, not automatic messaging.”

### Demo flow that proves realtime value
1. Sign up with a **new email** → empty private dashboard  
2. Settings → set **company name + logo**  
3. Add customer + product  
4. Create quotation → invoice → receive payment → open PDF  
5. Record a **purchase** → stock increases  
6. Open **Reports → Monthly Summary**  
7. Sign up a **second email** → show data is separate  

---

## 6. Pre-sale checklist (before handing to a client)

- [ ] Change JWT secret (`JWT_SECRET` env) — do not leave the default  
- [ ] Set company branding in Settings after first login  
- [ ] Confirm Chrome/Edge is installed where PDF will be generated  
- [ ] Test signup → invoice → payment → PDF on that machine  
- [ ] Explain: one company per signup (team invites not included yet)  
- [ ] Explain: no SMTP email yet  
- [ ] Optional: rename internal `machinehome` leftovers for white-label polish  

---

## 7. Module scorecard (at a glance)

| Module | Status |
|--------|--------|
| Multi-tenant signup & isolation | Realtime / Ready |
| Company branding | Realtime / Ready |
| Customers | Realtime / Ready |
| Products & inventory | Realtime / Ready |
| Quotations | Realtime / Ready |
| Invoices & payments | Realtime / Ready |
| Ledger & PDFs | Realtime / Ready |
| Suppliers & purchases | Realtime / Ready |
| Sales returns | Realtime / Ready |
| Dashboard | Realtime / Ready |
| Business / purchase / receiving reports | Realtime / Ready |
| Excel export (all tabs) | Partial |
| Roles & permissions | Partial (not enforced) |
| Email / SMTP | Partial (no mail server) |
| Purchase Orders UI | Future / API-only |
| WhatsApp auto-send | Future (link only) |
| Expense category settings | Hardcoded list |
| Favorites | Dummy schema only |

---

*Last updated to match the current codebase (multi-tenant ERP, purchases, sales returns, and business reports).*  
*Update this file whenever you ship a major feature so sales notes stay accurate.*
