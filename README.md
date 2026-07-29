# 💰 Intelligent Finance Dashboard

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)
![Version](https://img.shields.io/badge/version-2.0.0-informational.svg)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20Vanilla%20JS-yellow.svg)
![Frontend](https://img.shields.io/badge/frontend-Vercel-black.svg)
![Backend](https://img.shields.io/badge/backend-Render-purple.svg)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791.svg)
![Auth](https://img.shields.io/badge/auth-Google%20OAuth%20%2B%20Email%20OTP-success.svg)

> **The most over-engineered, beautifully crafted, AI-infused personal finance dashboard the world has ever seen.**  
> Built by a developer who refused to use a spreadsheet like a normal person.

---

## 📋 Table of Contents

- [What Is This Cosmic Creation](#-what-is-this-cosmic-creation)
- [Why This Exists](#-why-this-exists)
- [Live Demo](#-live-demo)
- [The Full Arsenal of Features](#-the-full-arsenal-of-features)
- [Tech Stack That Would Make NASA Proud](#-tech-stack-that-would-make-nasa-proud)
- [Project Architecture](#-project-architecture)
- [Data Flow — How The Magic Happens](#-data-flow--how-the-magic-happens)
- [Installation Guide For Mere Mortals](#-installation-guide-for-mere-mortals)
- [Environment Variables — The Secret Sauce](#-environment-variables--the-secret-sauce)
- [API Reference — Full Documentation](#-api-reference--full-documentation)
- [The Chart System — Data Visualizations That Slap](#-the-chart-system--data-visualizations-that-slap)
- [The Export System — PDF & Excel Like A Pro](#-the-export-system--pdf--excel-like-a-pro)
- [The Filtering System — Find Anything Instantly](#-the-filtering-system--find-anything-instantly)
- [The Insights Engine — AI That Actually Helps](#-the-insights-engine--ai-that-actually-helps)
- [Budget Management — Take Control](#-budget-management--take-control)
- [Dark Mode — For The Night Owls](#-dark-mode--for-the-night-owls)
- [Security — Fort Knox Level](#-security--fort-knox-level)
- [Deployment — Ship It To The Cloud](#-deployment--ship-it-to-the-cloud)
- [Roadmap — What's Coming Next](#-roadmap--whats-coming-next)
- [Contributing — Join The Mission](#-contributing--join-the-mission)
- [License](#-license)
- [Contact](#-contact)

---

## 🚀 What Is This Cosmic Creation

**Intelligent Finance Dashboard** is not just another expense tracker. It is a full-stack, production-ready, financial command center that transforms the way human beings interact with their money. This is what happens when a developer with OCD, a love for beautiful UI, and zero tolerance for boring software decides to build the ultimate personal finance tool.

Forget spreadsheets. Forget those generic apps with their dated interfaces and limited functionality. This dashboard gives you real-time financial intelligence, interactive data visualizations that would make a Bloomberg terminal blush, AI-powered insights that actually make sense, multi-format report exports, per-user authentication with Google OAuth and email OTP, per-account budget management, dark mode, and a level of polish that screams "this was made by someone who cares."

Every pixel, every animation, every line of code in this repository was crafted with the kind of obsessive attention to detail that usually requires therapy.

---

## 💡 Why This Exists

Most people have absolutely no idea where their money goes. They wake up one day, check their bank account, and wonder how they ended up broke after swiping their card for "just a few small purchases."

Traditional finance tools are either:
- **Too simple** — A list of transactions. Congratulations, you built a spreadsheet.
- **Too complex** — Enterprise accounting software that requires a degree in finance to operate.

There is a massive, gaping void in the middle: a tool that is intelligent enough to provide real value, visually stunning enough that you actually want to use it, and simple enough that your grandmother could figure it out in five minutes.

This project was built to fill that void. And then some.

---

## 🌐 Live Demo

| Environment | URL |
|---|---|
| **Frontend** | Deploy yours on Vercel |
| **Backend API** | Deploy yours on Render |

---

## ⚡ The Full Arsenal of Features

### 📊 Financial Analytics Engine

The analytics engine is the beating heart of this dashboard. It processes every single transaction in real time and surfaces the most relevant financial metrics with zero latency.

- **Real-time income and expense tracking** — every transaction is reflected instantly across all views, charts, and insights
- **Cycle-based analysis** — financial data automatically grouped by your billing cycle (25th to 24th)
- **Historical comparison** — compare current cycle spending against previous cycles to identify trends
- **Savings analysis** — automatically calculates net savings per cycle with animated counters
- **Spending distribution** — breaks down expenses across all categories with percentage shares
- **Top expense detection** — surfaces the top 5 categories consuming the largest portion of your income
- **Balance evolution** — tracks running balance and color-codes it (green = good, red = trouble, gray = exactly zero)
- **Calendar heatmap** — visual representation of daily spending with an intuitive color gradient
- **Cycle-over-cycle comparison** — percentage change indicators for income and expenses

### 🧠 Intelligent Insights Engine

This is not a generic "you spent money" notification system. This is a rule-based pattern recognition engine that analyzes your financial behavior across multiple dimensions and serves you human-readable, actionable intelligence.

The engine runs four distinct analytical rules on every data refresh:

1. **High spending detection** — flags when you've used 80%+ of your income
2. **Category dominance analysis** — identifies which category is eating the largest share of your wallet
3. **Positive balance recognition** — celebrates when you're saving money (because positive reinforcement works)
4. **Biggest expense spotlight** — calls out your single largest transaction

Each insight is dynamically generated from YOUR actual data. There are no hardcoded strings. Every message is unique to your financial situation.

### 📁 Report Generation System

#### PDF Reports
Generated with jsPDF, featuring:
- Professional landscape layout with proper typography
- Date range selection with formatted headers
- Auto-generated transaction tables with color-coded headers
- Pagination with footer branding
- Proper Colombian peso formatting (COP)

#### Excel Reports
Generated with SheetJS (XLSX), featuring:
- Multi-sheet workbook structure
- Formatted headers and clean data layout
- Automatic column organization
- Ready for further analysis in Excel, Google Sheets, or any spreadsheet software

### 🔍 Advanced Filtering System

The filtering system is fully client-side and processes in real time:

| Filter | Description |
|---|---|
| **Transaction Type** | Income, Expense, or All |
| **Category** | Filter by any spending category |
| **Description** | Case-insensitive keyword search |
| **Calendar Date** | Click any day on the heatmap to filter |
| **Date Range** | Custom start and end dates for exports |

All filters stack. All filters update instantly. A single "Clear Filters" button resets everything.

### 🗂 Transaction Management

Full CRUD with a clean, fast interface:
- **Create** — register transactions with type, amount, description, and category
- **Read** — transactions grouped by month and week with expandable sections
- **Update** — edit any field inline via a pre-filled modal
- **Delete** — individual deletion with confirmation, or bulk delete with double confirmation
- **Select All** — checkbox-based bulk selection with animated counter

### 🎨 Professional UI/UX Design

Every pixel is intentional. Every interaction has feedback. Every animation serves a purpose.

- **Clean sidebar navigation** with collapsible mode and mobile responsiveness
- **Color-coded financial states** — green for income, red for expenses, emerald for positive balance
- **Animated counters** — numbers count up smoothly when data loads
- **Expandable transaction groups** — organized by month, then by week, with toggles
- **Category badges** — visual tags for every expense category
- **Responsive design** — works on desktop, tablet, and mobile
- **Dark mode** — fully implemented with system-wide toggle and persistence
- **Google Material-inspired** avatar menu with user info and quick actions

### 👤 Authentication System

Two authentication methods, both production-ready:

1. **Google OAuth 2.0** — one-click sign-in with your Google account
2. **Email OTP** — receive a 6-digit code via email, no password needed

Both methods create an isolated user session. Your data belongs to you and only you.

---

## 🛠 Tech Stack That Would Make NASA Proud

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | Semantic document structure |
| Vanilla JavaScript (ES2022+) | Zero frameworks. Zero bloat. Maximum performance. |
| TailwindCSS (CDN) | Utility-first styling at lightspeed |
| Chart.js 4.x | Interactive, animated data visualizations |
| Moment.js + chartjs-adapter-moment | Time-based chart formatting |
| jsPDF 2.x | Client-side PDF generation |
| SheetJS (XLSX) 0.18.x | Excel file creation |
| Google Identity Services | OAuth 2.0 authentication |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ | JavaScript runtime |
| Express.js 4.x | HTTP server and routing |
| PostgreSQL | Relational database |
| pg (node-postgres) | Database driver with connection pooling |
| Nodemailer | Email transport for OTP codes |
| CORS | Cross-origin resource sharing |
| dotenv | Environment variable management |

---

## 🧱 Project Architecture

```
Frontend-Finanzas/
├── index.html          # Main application shell
├── main.js             # Application logic, navigation, state management
├── charts.js           # Chart.js initialization and rendering
├── api.js              # API client with localStorage fallback
├── import.js           # Excel import functionality
└── README.md           # This document you're reading right now

Backend-Finanzas/
├── server.js           # Express server entry point
├── routes.js           # Transaction CRUD API routes
├── auth.js             # Authentication routes (email OTP)
├── db.js               # PostgreSQL connection pool
├── createTable.js      # Database migration script
├── migration.sql       # Database schema SQL
├── clearData.js        # Data truncation utility
├── init-db.sql         # Legacy schema (use migration.sql instead)
├── clear-data.sql      # Legacy truncation script
├── package.json        # Dependencies and scripts
└── .env                # Environment variables (not committed)
```

---

## 🔄 Data Flow — How The Magic Happens

```
User clicks button
       │
       ▼
main.js updates state
       │
       ├──► api.js ──► Express API ──► PostgreSQL
       │                                    │
       │◄─────────── JSON Response ────────┘
       │
       ├──► charts.js (re-renders all charts)
       ├──► insights engine (re-analyzes data)
       ├──► budget system (re-calculates limits)
       └──► DOM update (transaction list, summary cards, calendar heatmap)
```

All in under 100ms. Every single time.

---

## 📦 Installation Guide For Mere Mortals

### Prerequisites
- Node.js 18 or higher
- npm 8 or higher
- PostgreSQL database (local or cloud)
- A modern browser (Chrome, Firefox, Edge, or Safari)

### Step 1 — Clone The Repository

```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo/Backend-Finanzas
```

### Step 2 — Configure Environment Variables

Create a `.env` file in `Backend-Finanzas/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/finanzas
PORT=3000
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
```

### Step 3 — Install Dependencies

```bash
npm install
```

### Step 4 — Run Database Migration

```bash
npm run migrate
```

### Step 5 — Start The Server

```bash
npm start
```

Your API is now live at `http://localhost:3000`.

### Step 6 — Launch The Frontend

Open `Frontend-Finanzas/index.html` in your browser, or use any static file server:

```bash
npx serve Frontend-Finanzas/
```

Alternatively, just double-click the HTML file. Yes, it's that simple.

---

## 🔐 Environment Variables — The Secret Sauce

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: 3000) |
| `EMAIL_ADDRESS` | ✅ | Gmail address for sending OTP codes |
| `EMAIL_PASSWORD` | ✅ | Gmail app password |
| `EMAIL_SMTP_HOST` | ✅ | SMTP host (default: smtp.gmail.com) |
| `EMAIL_SMTP_PORT` | ✅ | SMTP port (default: 587) |
| `PGSSL` | ❌ | Force SSL mode for database connection |

Never commit your `.env` file. It's already in `.gitignore`.

---

## 📡 API Reference — Full Documentation

Base URL: `https://backend-finanzas-m3fb.onrender.com/api` (or your local `http://localhost:3000/api`)

### Authentication

#### `POST /api/auth/send-code`
Send a 6-digit OTP code to an email address.

```json
{ "email": "user@example.com" }
```

#### `POST /api/auth/verify-code`
Verify the OTP code and receive a user session.

```json
{ "email": "user@example.com", "code": "123456" }
```

### Transactions

#### `GET /api/transactions?user_id={id}`
Get all transactions for a user.

#### `POST /api/transactions`
Create a new transaction.

```json
{
  "user_id": "user_123",
  "type": "expense",
  "amount": 50000,
  "description": "Supermarket",
  "date": "2026-07-28",
  "category": "Mercado"
}
```

#### `PUT /api/transactions/:id`
Update an existing transaction.

#### `DELETE /api/transactions/:id?user_id={id}`
Delete a single transaction.

#### `DELETE /api/transactions/all?user_id={id}`
Delete all transactions for a user.

### Health

#### `GET /`
Server status check.

#### `GET /api/test-db`
Database connection test.

---

## 📊 The Chart System — Data Visualizations That Slap

Four charts, one library (Chart.js), zero compromises:

1. **Balance Chart** — Income vs Expenses bar chart for the current cycle
2. **Distribution Chart** — Doughnut chart showing expense breakdown by category with an interactive legend
3. **Top 5 Categories** — Horizontal progress bars with percentage of income consumed
4. **Historical Chart** — Line or bar chart configurable by category, period (monthly/yearly), and chart type

All charts are responsive, animated, and update automatically when data changes. No page reloads. No manual refresh. Just smooth, satisfying data visualization.

---

## 📤 The Export System — PDF & Excel Like A Pro

### PDF Export
- Generates a complete transaction report with title, date range, and formatted table
- Uses jsPDF with auto-table plugin
- Professional green header styling
- Colombian peso formatting
- One-click download

### Excel Export
- Generates a properly structured `.xlsx` file with headers and formatted data
- Uses SheetJS (XLSX) for maximum compatibility
- Ready for pivot tables, charts, and further analysis
- One-click download

Both exports require a date range to be selected. No empty reports. No data dumps. Clean, professional output every time.

---

## 🔍 The Filtering System — Find Anything Instantly

The filtering system is a composable, multi-criteria search engine that operates entirely on the client side:

- **Type filter** — toggle between all, income, or expense
- **Category filter** — automatically disables when "income" is selected (because income doesn't have categories)
- **Description search** — real-time keyword matching as you type
- **Calendar date filter** — click any day on the heatmap to see that day's transactions
- **Date range** — for exports only, select start and end dates

Every filter combination works together. The result is instant. The UI updates without a single network request.

---

## 🧠 The Insights Engine — AI That Actually Helps

The Insights Engine runs four analytical rules every time your data changes:

### Rule 1: 💸 High Spending Alert
If your expenses exceed 80% of your income, a danger card appears telling you exactly how much you've burned through.

### Rule 2: ⚠️ Category Dominance
The engine identifies which spending category is dominating your finances and tells you what percentage of your total expenses it represents.

### Rule 3: 📈 Positive Balance
If you're spending less than you earn, the engine celebrates your victory with a success card showing your exact savings.

### Rule 4: 🧾 Biggest Expense
The engine surfaces your single largest transaction and tells you exactly what it was and how much it cost.

Each insight is rendered as a beautiful card with a colored icon, bold title, and contextual message. No fluff. No generic advice. Pure, data-driven intelligence.

---

## 🎯 Budget Management — Take Control

Per-user budget management that actually works:
- **Create budgets** per category with a numeric input formatted with thousand separators
- **Real-time tracking** — see exactly how much you've spent vs your limit
- **Visual progress bars** — color-coded: green (safe), yellow (warning at 80%), red (exceeded at 100%)
- **Per-user isolation** — your budgets stay your budgets, even on shared devices
- **Delete budgets** with a single click when you want to reconfigure

---

## 🌙 Dark Mode — For The Night Owls

- Toggle dark mode with a single click
- Persists across sessions via localStorage
- Smooth toggle animation with moon/sun icons
- All charts adapt to dark mode automatically
- Every UI element is themed — modals, cards, tables, sidebar, inputs, buttons

---

## 🔒 Security — Fort Knox Level

- **Input sanitization** on all user inputs
- **Parameterized SQL queries** — zero risk of SQL injection
- **CORS** — API only accepts requests from allowed origins
- **Environment isolation** — all secrets in `.env`, never in source code
- **Passwordless auth** — no passwords to leak, just OTP codes that expire in 5 minutes
- **Google OAuth** — industry-standard authentication
- **User data isolation** — all queries filter by `user_id`

---

## ☁️ Deployment — Ship It To The Cloud

### Backend (Render.com)
1. Push `Backend-Finanzas/` to a GitHub repository
2. In Render, create a **New Web Service** connected to that repo
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variables in Render dashboard:
   - `DATABASE_URL` (from Render PostgreSQL)
   - `EMAIL_ADDRESS`, `EMAIL_PASSWORD`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`
6. After deploy, run `npm run migrate` from Render's shell
7. Set Health Check Path: `/`

### Frontend (Vercel)
1. Push `Frontend-Finanzas/` to a GitHub repository
2. In Vercel, create a **New Project** connected to that repo
3. Vercel auto-detects it as a static site — zero configuration needed
4. If needed, set `API_URL` environment variable for production

---

## 🗺 Roadmap — What's Coming Next

- [ ] **Recurring Transactions** — auto-generate monthly bills and subscriptions
- [ ] **Multi-currency support** — with real-time exchange rates
- [ ] **PWA support** — install as a native app on any device
- [ ] **Bank integration** — read-only connection via Plaid/TrueLayer
- [ ] **Advanced AI insights** — GPT-powered financial coaching
- [ ] **Spending forecasts** — predict next month based on historical patterns
- [ ] **Goal tracking** — save for specific goals with visual progress
- [ ] **Data export improvements** — CSV, JSON, and more formats
- [ ] **Mobile-optimized layout** — dedicated mobile views

---

## 🤝 Contributing — Join The Mission

Contributions are not just welcome — they are celebrated. If you have an idea, a bug fix, or a feature that would make this dashboard even more legendary, here's how to contribute:

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-amazing-idea`
3. **Make your changes** with clean, readable code
4. **Commit** with a descriptive message following conventional commits
5. **Push**: `git push origin feature/your-amazing-idea`
6. **Open a Pull Request** with a clear description

Commit convention:
```
feat: add new feature
fix: fix a bug
docs: update documentation
refactor: code restructuring
perf: performance improvement
```

---

## 📄 License

This project is licensed under the **MIT License** — you are free to use, modify, copy, and distribute this software. Attribution is appreciated but not required. Go build something amazing.

---

## 📬 Contact

Created with blood, sweat, tears, and an unhealthy amount of caffeine by **Emmanuel**.

Questions? Ideas? Just want to say hi?  
**Email: alemmanuel0412@gmail.com**

---

<div align="center">
  <strong>Built with 💙 by Emmanuel</strong>
  <br>
  If this project helped you, saved you time, or inspired you — star it, share it, build with it.
  <br>
  Your support fuels the next feature.
</div>
