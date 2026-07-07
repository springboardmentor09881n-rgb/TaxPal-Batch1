# TaxPal: Personal Finance & Tax Estimator for Freelancers

TaxPal is a modern, high-fidelity web application designed to help freelancers manage their finances, log business expenses, monitor revenues, and estimate their tax obligations. 

The project is structured as a monorepo consisting of a secure backend API and a standalone Angular frontend application.

---

## 🏗️ Project Architecture

The workspace is organized into two primary directories:

```text
TaxPal-Batch1/
├── backend/       # Node.js, Express, TypeScript, & MongoDB API Server
└── frontend/      # Angular v20 Standalone Component Client App
```

### 1. Backend Layer (`backend/`)
- Built with **Node.js**, **Express.js**, **TypeScript**, and **Mongoose**.
- Implements strict **MVC pattern** and modular API routing.
- Secured using **Helmet.js**, CORS filters with credentials, **Express Rate Limits** (100 reqs/15m), and MongoDB input sanitization.
- Features JWT access token cookies, session refresh routes, and Zod validator middlewares.

### 2. Frontend Layer (`frontend/`)
- Built with **Angular v20** Standalone Components.
- Styled with premium, customized CSS featuring modern glassmorphism cards, radial gradient glow backdrops, and glowing inputs.
- Form validations built reactively into inputs for immediate UX feedback.
- Real-time calculations: card summaries dynamically display Monthly Income, Monthly Expenses, and Total Savings fetched from the database rather than hardcoded fake data.

---

## 🌟 Key Application Features

### Redesigned Login & Signup Pages
- **Validation**: Strict client-side check for email formats and field presence.
- **Confirm Password**: Instant equality comparison as the user types, highlighting mismatches dynamically.
- **Password Strength Indicator**: A color-changing score bar (Red/Weak ➔ Yellow/Medium ➔ Green/Strong) evaluating minimum length (8+), uppercase, and digit rules.
- **Conditional Formatting**: State/Province text input appears dynamically only if country is India, US, Canada, or Australia.
- **No Role Selector**: Defaults securely to `Employee` for freelancers, eliminating employer roles from the UI.
- **Backend Sync**: Connects directly to backend validation schemas, returning clear alert blocks if logins fail.

### Redesigned Financial Dashboard
- **Dynamic Totals**: Loads transaction records and computes totals in real-time.
- **Responsive Sidebar**: Styled dark navigation sidebar with vector SVG icons.
- **CRUD Operations**: Connects "Add Income" and "Add Expense" forms to create database entries, and adds a deletion button next to records to instantly remove items and update card calculations.
- **Empty States**: Display visual prompts when no transactions are recorded to guide users.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or above)
- MongoDB running locally (e.g. `mongodb://localhost:27017`) or a MongoDB Atlas connection string.

---

### Step 1: Run the Backend API

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Configure environment parameters by copying `.env.example` to `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/salary-management
   JWT_SECRET=your_jwt_access_secret_key
   JWT_EXPIRES=15m
   REFRESH_SECRET=your_jwt_refresh_secret_key
   REFRESH_EXPIRES=7d
   NODE_ENV=development
   ```
4. Start the development server (runs on port `5000`):
   ```bash
   npm run dev
   ```

---

### Step 2: Run the Frontend Client

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Angular dev server (runs on `http://localhost:4200/`):
   ```bash
   ng serve
   ```
4. Open a browser page at `http://localhost:4200/` to explore.
