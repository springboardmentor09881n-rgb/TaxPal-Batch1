# TaxPal: Personal Finance & Tax Estimator for Freelancers

**TaxPal** is a premium, full-stack personal finance tracking and tax estimation application built to help freelancers, gig workers, and self-employed individuals manage their finances efficiently. The application enables users to track income and expenses, attach receipt uploads, manage custom categories, set monthly budgets, monitor real-time spending progress, dynamically estimate quarterly tax liabilities, and generate advanced financial reports.

Developed as part of the **Infosys Springboard Internship Program**, TaxPal delivers a secure and responsive interface using a monorepo setup consisting of a robust Node.js backend (Express & TypeScript) and a modern Angular frontend (Signals & Standalone Components).

---

## 🏗️ Project Architecture & Structure

The repository is organized into two primary project folders:
- **`backend/`**: A Node.js & Express REST API built with TypeScript and MongoDB.
- **`frontend/`**: An Angular client application utilizing Standalone Components, Signal-based state management, and modern CSS styling.

```text
TaxPal-Batch1/
├── backend/                  # Node.js / Express.js Backend API (TypeScript)
│   ├── src/
│   │   ├── config/           # Database configuration, environment schema, logger
│   │   ├── controllers/      # MVC controllers (Auth, Transaction, Budget, Category, TaxEstimate, Alert, Report, Receipt, Chat, Scam, Document)
│   │   ├── middleware/       # Route protection, request validation, error handler, upload parser
│   │   ├── models/           # Mongoose schemas (User, Transaction, Budget, Category, TaxEstimate, Alert, Report, ScheduledReport, Chat)
│   │   ├── routes/           # Express routes mapping endpoints to controllers
│   │   ├── services/         # Business logic & database operations (Auth, Category, Mailer, Report, Schedule)
│   │   ├── types/            # TypeScript interface definitions
│   │   ├── utils/            # Shared utilities (ApiError, ApiResponse, taxCalculator)
│   │   └── validators/       # Zod schemas for request validation
│   ├── .env.example          # Template for backend environment variables
│   ├── package.json          # Backend dependencies and run scripts
│   ├── tsconfig.json         # TypeScript compilation configs
│   └── README.md             # Backend setup & API documentation
│
├── frontend/                 # Angular Frontend Client App
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Shared UI components (Chatbot, Dropdown)
│   │   │   ├── pages/        # Router pages (Login, Signup, Dashboard, Income, Expense, Budgets, Profile, Transactions, TaxEstimator, Reports, ReceiptScanner)
│   │   │   ├── services/     # Angular Services (Auth, Api)
│   │   │   ├── app.config.ts # Configuration and provider bootstrapping
│   │   │   ├── app.routes.ts # Frontend navigation routing configuration
│   │   │   └── app.ts        # Main application component
│   │   ├── index.html        # Main HTML layout wrapper
│   │   ├── main.ts           # Frontend app bootstrap file
│   │   └── styles.css        # Global CSS stylesheet (custom dark/light design system)
│   ├── angular.json          # Angular CLI project configurations
│   ├── package.json          # Frontend packages & build scripts
│   └── README.md             # Frontend setup instructions
│
└── README.md                 # Root project documentation (this file)
```

---

## 🚀 Technical Stack

### Frontend
- **Framework**: Angular v20 (Standalone Components & Signals API)
- **Styling**: Vanilla CSS3 (Custom Responsive Layouts, CSS Variables, Theme Toggling, Glassmorphism, and transition animations)
- **Data Visualization**: Chart.js (Interactive spending breakdown & transaction analytics)
- **Language**: TypeScript & HTML5
- **Communication & State**: Angular Signals, RxJS, HttpClient, custom HTTP Interceptors
- **AI UI**: Real-time Server-Sent Events (SSE) streaming display & page-context Suggestion Chips

### Backend
- **Runtime & Framework**: Node.js & Express.js (REST API, TypeScript compilation)
- **Database & ODM**: MongoDB & Mongoose (Strict schema enforcement, compound indexing, and virtual fields)
- **AI Integrations**: Gemini 3.5 Flash (via `@google/genai` SDK) for OCR parsing and AI financial assistant chats
- **PDF Generation**: PDFKit (Dynamic PDF rendering with styling and tables)
- **Email Service**: Nodemailer (Automated report deliveries with attachment support, featuring an offline console-log email simulator fallback)
- **Security & Guards**: Helmet.js (Security headers), CORS (with session credentials), Mongo-Sanitize (NoSQL query protection), Express-Rate-Limit (DDoS defense), Zod Validator (Schema verification), Bcrypt password hashing
- **Authentication**: JWT (JSON Web Tokens) with Short-lived Access Tokens (15m in HTTP-only cookies) & Rotate Refresh Tokens (7d)

---

## 🌟 Key Application Features

### 1. Authentication & Security
- Secure registration and login flow.
- Access tokens stored in secure, HTTP-only cookies; automatic session refreshing.
- Input validations (email correctness, password strength checking with real-time scoring bars, mismatch feedback).
- **Forgot & Reset Password**: Recovery workflows sending temporary verification tokens (OTP) via mail or local mock handlers.
- **Session Manager**: View active login sessions (IP address, login times, device user agent) and remotely terminate other sessions ("Log out other sessions") for enhanced account security.

### 2. Interactive Financial Dashboard
- High-level KPI cards computing **Monthly Income**, **Monthly Expenses**, **Estimated Tax Due**, and **Savings Rate** in real-time.
- Dynamic charts detailing month-over-month comparisons and category-wise spending.
- Quick action buttons to immediately record income or expense.
- Live activity feed showing the most recent transactions with type icons.

### 3. Transaction Management & Receipt Attachment
- Full CRUD operations to log and edit income/expense transactions.
- Customized attributes including transaction descriptions, date pickers, values, custom category maps, and additional notes.
- **Receipt Attachments**: Upload and store receipt images alongside transactions, with a slide-out preview drawer to view images directly.

### 4. Smart Auto-Categorization Engine
- Intelligent keyword-matching algorithm that suggests the most appropriate category based on the transaction description (e.g., `uber` -> `Travel/Meals`, `aws` -> `Software/SaaS`, `ads` -> `Marketing/Ads`, `laptop` -> `Hardware/Gadgets`).

### 5. Category-Based Budgeting
- Set spending limits per category per month.
- Automatic background calculations checking spent aggregates against budgeted limits.
- Dynamic visual warning notifications (safe spending, near-limit alerts, over-budget indicators).

### 6. Tax Estimator Module
- Select country/region and state of residence.
- Compute quarterly tax liabilities based on regional tax slabs.
- Factor in gross quarterly revenues, business expenses, retirement contributions, health insurance premiums, and home office deductions.

### 7. Reminder & Alert Notification System
- Log automated alerts for upcoming tax deadlines.
- Dynamic calendar interface detailing payment schedules and tax savings suggestions.

### 8. AI-Powered Financial Assistant (Chatbot)
- Real-time conversational AI powered by **Gemini 3.5 Flash** (with local offline mock fallback) accessible via a floating chat interface.
- **Context-Aware Intent Engine**: Automatically queries user data (transactions, budgets, tax estimates) to answer complex queries based on actual user context.
- **SSE Streaming**: Streams response chunks character-by-character for a smooth user experience.
- **Contextual Suggestion Chips**: Offers smart prompts depending on which tab the user is on (e.g. tax questions when on the Tax page, spending analysis when on the Transactions page).
- **Report Actions**: Triggers report generation directly from the chat UI when requested (e.g. *"Generate a PDF report"*).
- **Multi-session support**: Manage multiple chat sessions, view session logs, and delete chat histories.

### 9. AI Receipt Scanner & OCR
- Upload receipt images or PDF files to automatically extract transaction details.
- Extracts description/merchant, amount, transaction type (Income/Expense), transaction date, category, and currency.
- Matches extracted category against user's custom category list with smart keyword mapping.
- Review-before-save page allows users to review and edit details before writing them to the database.

### 10. Advanced Financial Reporting
- Generates multiple financial reports: **Income Statement**, **Profit & Loss (P&L) Statement**, **Income & Expense Summary**, **Expense Breakdown**, and **Tax Summary (IRS Schedule C Form 1040)**.
- Formats: Dynamic **PDF** (styled layout rendered via PDFKit) or **CSV**.
- Custom date filters (Current/Last Month, Current/Last Quarter, YTD, Full Year, or Custom range picker).
- Download reports locally or instantly email them to any configured address.

### 11. Automated Report Scheduler
- Schedule recurring report delivery directly to configured email addresses.
- An active background worker daemon sweeps active schedules and dispatches PDF/CSV reports.

---

## 📂 Database Schema Overview

```mermaid
erDiagram
    User ||--o{ Transaction : logs
    User ||--o{ Budget : plans
    User ||--o{ Category : creates
    User ||--o{ TaxEstimate : calculates
    User ||--o{ Alert : receives
    User ||--o{ Report : generates
    User ||--o{ Chat : initiates
    User ||--o{ ScheduledReport : configures

    User {
        ObjectId id
        string email
        string password
        string role
        string fullName
        string username
        string phone
        string country
        string state
        string city
        string language
        string incomeBracket
        string avatar
        string currencyPreference
        boolean twoFactorEnabled
        string twoFactorMethod
        array deviceSessions
        string_array refreshTokens
        boolean autoCategorizeEnabled
        array categoryMappings
        string resetOtp
        date resetOtpExpires
    }

    Transaction {
        ObjectId id
        ObjectId userId
        string type
        string description
        string category
        number amount
        date transactionDate
        string notes
        string receiptImage
    }

    Budget {
        ObjectId id
        ObjectId userId
        string category
        number limit
        string month
        string description
    }

    Category {
        ObjectId id
        ObjectId userId
        string name
        string type
        string color
        string icon
        boolean isDefault
        boolean taxDeductible
        number sortOrder
    }

    TaxEstimate {
        ObjectId id
        ObjectId userId
        string country
        string state
        string quarter
        number estimatedTax
        date dueDate
        string status
        string filingStatus
        number grossIncomeForQuarter
        number businessExpenses
        number retirementContribution
        number healthInsurancePremiums
        number homeOfficeDeduction
    }

    Alert {
        ObjectId id
        ObjectId userId
        string type
        string message
        date alertDate
        boolean isRead
    }

    Report {
        ObjectId id
        ObjectId userId
        string period
        date periodStart
        date periodEnd
        string reportType
        string format
        number totalIncome
        number totalExpenses
        number netSavings
        string filePath
        object data
    }

    Chat {
        ObjectId id
        ObjectId user
        string title
        array messages
    }

    ScheduledReport {
        ObjectId id
        ObjectId userId
        string email
        string reportType
        string format
        string status
        date lastSent
    }
```

---

## 🔑 Core API Endpoints

### Authentication & Profile (`/api/auth`)
- `POST /register`: Registers a new user account.
- `POST /login`: Authenticates user, signs JWTs, and sets secure HTTP-only cookies.
- `POST /refresh`: Rotates and issues new access/refresh tokens.
- `POST /logout`: Revokes user tokens and clears cookies.
- `GET /profile`: Fetches current logged-in user profile attributes.
- `PUT /profile`: Updates user profile settings (avatar, country, state, language, income bracket, etc.).
- `PUT /password`: Updates account password (validating current password).
- `POST /forgot-password`: Generates a reset password OTP.
- `POST /reset-password`: Validates OTP and sets a new password.
- `GET /sessions`: Retrieves a list of active login sessions (devices, IPs).
- `POST /sessions/logout-others`: Log out of all other devices/sessions.

### Transaction Management (`/api/transactions`)
- `POST /`: Log a new transaction (Income or Expense) supporting receipt image parameters.
- `GET /`: Retrieve all transactions for the authenticated user (supports filtering, searching, and sorting).
- `GET /:id`: Retrieve transaction details by ID.
- `PUT /:id`: Update transaction details.
- `DELETE /:id`: Delete a transaction record (re-computes dashboard cards instantly).

### Category Budgets (`/api/budgets`)
- `GET /`: Retrieve category budgets and calculate spent totals for the current month.
- `POST /`: Set or update a budget limit for a category.
- `DELETE /:category`: Remove a budget entry.

### Category Configuration (`/api/categories`)
- `GET /`: Fetch custom user categories.
- `GET /type/:type`: Fetch categories filtered by type (`income` or `expense`).
- `POST /`: Create a new custom category with hex color, icon class, and deduction status.
- `PUT /:categoryId`: Modify custom category configurations.
- `DELETE /:categoryId`: Remove custom category.
- `POST /initialize-default`: Seed initial standard categories.

### Tax Estimation (`/api/tax-estimates`)
- `GET /`: Retrieve list of all tax estimations.
- `POST /`: Save a quarterly tax estimation calculation.
- `GET /:id`: Get specific tax calculation details.
- `PUT /:id`: Edit recorded tax calculation variables.
- `DELETE /:id`: Delete a tax estimate.

### Alert Notifications (`/api/alerts`)
- `GET /`: Retrieve notifications and reminder status.
- `POST /`: Manually create/test an alert entry.
- `PUT /:id/read`: Mark an alert as read.
- `DELETE /:id`: Dismiss/delete an alert.

### Financial Reporting (`/api/reports`)
- `POST /`: Generate a new financial report (PDF or CSV).
- `GET /`: Get history of generated reports.
- `GET /:id`: Fetch metadata of a specific report.
- `GET /:id/download`: Download report file content.
- `POST /:id/email`: Send report as email attachment.
- `DELETE /:id`: Delete generated report.
- `POST /schedule`: Schedule a new recurring monthly report.
- `GET /schedule`: Get list of active recurring report schedules.
- `DELETE /schedule/:id`: Terminate a report schedule.

### Receipt Scanning (`/api/receipts`)
- `POST /scan`: Scans an uploaded receipt image or PDF file via Gemini AI and extracts key transaction fields.

### AI Chatbot Assistant (`/api/chat`)
- `POST /message`: Stream a conversation message with Gemini AI financial agent (returns SSE).
- `GET /sessions`: Fetch history of chat session titles.
- `GET /sessions/:id`: Get full messages log for a specific session.
- `DELETE /sessions/:id`: Delete a chat session.

---

## 🏆 Project Milestones Status

- **`[x]` Milestone 1: Transaction Logging**
  - Completed register/login auth workflow.
  - Setup core dashboard components and financial KPI cards.
  - Implemented manual transaction entry forms.
- **`[x]` Milestone 2: Categorization & Budgeting**
  - Completed Category CRUD and default seeding configurations.
  - Configured smart keyword auto-suggest logic.
  - Added monthly budget trackers and progress visualization meters.
- **`[x]` Milestone 3: Tax Estimation**
  - Integrated regional tax engine supporting custom deductions (Home Office, Health Insurance, etc.).
  - Added quarterly estimation records.
  - Integrated Interactive Calendar view and due-date alerts.
- **`[x]` Milestone 4: Reporting & AI Services**
  - Completed generating dynamic PDF and CSV reports.
  - Configured background worker schedules and email report dispatching.
  - Integrated Gemini-powered receipt scanning and conversational financial assistant.
  - Implemented session controls and password recovery security options.

---

## ⚙️ Getting Started & Setup

### Prerequisites
- **Node.js** (v18.x or above recommended)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a **MongoDB Atlas Cloud Connection URI**
- **GEMINI_API_KEY** (Optional, required for live AI OCR scanning and conversational chat assistant)

### 1. Backend Server Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependency modules:
   ```bash
   npm install
   ```
3. Configure environment parameters by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/taxpal
   JWT_SECRET=your_jwt_access_secret_key
   JWT_EXPIRES=15m
   REFRESH_SECRET=your_jwt_refresh_secret_key
   REFRESH_EXPIRES=7d
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=taxpal.app@gmail.com
   SMTP_PASS=your_gmail_app_password
   ```
4. Start the API server in development mode (hot reloads via nodemon):
   ```bash
   npm run dev
   ```
   *The server runs at: `http://localhost:5000`*

### 2. Frontend Angular Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependency packages:
   ```bash
   npm install
   ```
3. Start the Angular local development server:
   ```bash
   npm start
   ```
   *The client app boots and is accessible at: `http://localhost:4200`*

---

## 👥 Development Team

Developed as part of the **Infosys Springboard Internship Program** by:
- **Team Leader**: K Sujay
- **Backend Team**: Rohith, Dhanshri
- **Frontend Team**: Afsana, Gowthami
