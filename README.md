# Agile Warehouse UI

A **React + Vite + TypeScript** front-end for Agile Warehouse – an inventory-management platform backed by **Supabase**.  The UI lets Admins, Warehouse Managers and Field Operators manage stock-in, stock-out, transfers and barcode-driven look-ups with real-time updates.

---
## 📂 Project structure
```
├─ src/
│  ├─ components/            # Re-usable UI & feature components
│  ├─ hooks/                 # React-Query data hooks
│  ├─ layouts/               # Route layouts
│  ├─ pages/                 # Route-level pages
│  ├─ integrations/supabase/ # Supabase client & generated types
│  ├─ utils/                 # Helpers (barcodeUtils, formatters…)
│  └─ ...
├─ supabase/
│  └─ functions/             # Edge functions (Deno)
│     └─ stock_in_process.ts # Atomic stock-in transaction
├─ migrations/               # SQL migrations
└─ README.md
```

---
## 🛠️ Setup
1. **Clone & install**
   ```bash
   git clone https://github.com/your-org/agile-warehouse-ui
   cd agile-warehouse-ui
   npm i
   ```
2. **Environment variables** – copy & fill `.env.local`:
   ```bash
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<public anon key>
   ```
3. **Start dev server**
   ```bash
   npm run dev
   ```
4. **Storybook (optional)**
   ```bash
   npm run storybook
   ```

---
## 🔌 Supabase backend
Project ref: `kysvcexqmywyrawakwfs`

### Tables (simplified)
| Table              | Purpose                                   |
|--------------------|-------------------------------------------|
| `stock_in`         | Stock-in requests (submitted by mobile)   |
| `processed_batches`| Header rows per warehouse/location batch  |
| `batch_items`      | Box-level rows per batch                  |
| `stock_in_details` | Legacy/parallel box rows                  |
| `inventory`        | Current inventory (box level)             |

### Edge Function
`supabase/functions/stock_in_process.ts`
* Accepts JSON payload `{ run_id, stock_in_id, user_id, batches[] }`.
* Runs **all inserts in a single transaction** – rollback on failure.
* Idempotent via unique `client_run_id`.

Helper SQL (added via `migrations/add_tx_helpers.sql`)
```sql
create or replace function begin_transaction() returns void …
create or replace function commit_transaction() returns void …
create or replace function rollback_transaction() returns void …
```

---
## 🖥️ Key Features
### 1 · Stock-In Wizard
Multi-step dialog for processing stock-in requests:
1. **Review** – read-only summary.
2. **Batches** – assign boxes → batches; generate barcodes.
3. **Finalize** – preview all barcodes, print & submit.

On submit the UI calls the Edge Function; if the call fails it gracefully falls back to the older client-side loop.

### 2 · Barcode Generator & Scanner
* **/admin/barcodes** – generate, preview, print CODE-128 barcodes.
* **Scanner** uses `quaggaJS` for live camera scanning and `useBarcodeProcessor` for look-ups.

### 3 · Inventory Dashboard
List of boxes with live quantity, warehouse & zone; per-row print icon opens `BarcodePrinter` modal.

---
## 💻 Scripts
| command            | description                 |
|--------------------|-----------------------------|
| `npm run dev`      | Vite development server     |
| `npm run build`    | Production build            |
| `npm run lint`     | ESLint + Prettier           |
| `npm run storybook`| Component playground        |

---
## 🧑‍💻 Coding standards
* **Type safety** – no `any`; generated Supabase types.
* **React-Query** for data fetching (`src/hooks`).
* **shadcn/ui** for consistent design tokens.
* Components ≤ 300 lines; split otherwise.
* Follow the detailed standards in `.vscode/…` & the custom instructions at the top of this README.

---
## 🔒 Auth flow
* Supabase email-link login.
* `AuthProvider` stores session; `RequireAuth` guards private routes.
* Edge Functions verify JWT via `Authorization: Bearer <token>` header.

---
## 🧪 Testing
* **Vitest** for unit tests (`npm t`).
* **React Testing Library** for component tests.
* Critical flows (stock-in, print) covered by Cypress e2e (see `cypress/`).

---
## 🚀 CI / CD
* **GitHub Actions** – lint, test, build on pull-request.
* On `main` push: builds & deploys Vercel preview, triggers Supabase function deploy via `supabase functions deploy`.

---
## 📜 License
MIT © Agile Warehouse
