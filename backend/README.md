# TaxPal: Personal Finance & Tax Estimator for Freelancers API

A production-ready, highly secure, and scalable backend for **TaxPal: Personal Finance & Tax Estimator for Freelancers**. Built using **Node.js**, **Express.js**, **TypeScript**, and **MongoDB/Mongoose**, this project implements **Clean Architecture** and the **MVC (Model-View-Controller)** pattern with a dedicated **Service & Utility Layer**.

---

## 🏗️ Architecture & Folder Structure

The project follows a modular MVC + Service + Utility architecture:

```text
backend/
├── src/
│   ├── config/          # Environment variables, database connection, winston logger
│   ├── controllers/     # Controller layer (HTTP requests/responses, status codes)
│   ├── middleware/      # Middleware (JWT Auth, Zod Validation, Error Handling, Rate Limiting)
│   ├── models/          # Mongoose database models (User, Transaction, Budget, Category, TaxEstimate, Alert)
│   ├── routes/          # Express route definitions mapped to controllers
│   ├── services/        # Service layer (Business logic, DB interactions, Alert auto-triggering)
│   ├── types/           # Global TypeScript declarations and Express overrides
│   ├── utils/           # Utility helpers (Tax Calculator, ApiError, ApiResponse, Constants)
│   ├── validators/      # Zod validation schemas for request bodies and parameters
│   ├── app.ts           # Express Application setup and middleware pipeline config
│   └── server.ts        # Server entry point, database connection and port listening
├── .env                 # Environment variables config
├── package.json         # Project manifests and dependency configurations
├── tsconfig.json        # TypeScript compiler configurations
└── README.md            # Backend documentation
```

---

## 🎯 Key Features & Completed Milestones

### 🔐 Milestone 1: Authentication & Transactions
* **JWT Authentication**: Secure user registration, login, token refresh, and logout with bcrypt password hashing (10 rounds).
* **Transaction Management**: Income and Expense CRUD operations, date-range filtering, and aggregation.

### 📊 Milestone 2: Budgeting & Categories
* **Budget Tracking**: Set monthly spending limits per category, track month-to-date progress, and calculate remaining budgets.
* **Category Management**: Default category seeding (Software, Office Supplies, Travel, Utilities, etc.) and category utilities.

### 🧮 Milestone 3: Tax Estimation & Quarterly Alerts
* **Tax Estimator**: 
  * Calculates quarterly estimated tax based on quarterly income and valid deductions (Business Expenses, Retirement, Health Insurance, Home Office).
  * **Annualization & Progressive Slab Calculation**:
    1. $\text{Annual Income} = \text{grossIncomeForQuarter} \times 4$
    2. $\text{Annual Taxable Income} = \text{Annual Income} - \text{Annual Deductions}$
    3. Progressive Tax Slabs (Indian New Tax Regime: ₹0-4L 0%, ₹4L-8L 5%, ₹8L-12L 10%, ₹12L-16L 15%, ₹16L-20L 20%, ₹20L-24L 25%, >24L 30%).
    4. $\text{Quarterly Estimated Tax} = \frac{\text{Annual Estimated Tax}}{4}$
  * **Automated Due Date Generation**:
    * Q1 $\rightarrow$ 15 June
    * Q2 $\rightarrow$ 15 September
    * Q3 $\rightarrow$ 15 December
    * Q4 $\rightarrow$ 15 March (Next Year)
* **Alerts Module**:
  * **Automatic Alert Trigger**: Creating a tax estimate automatically generates a `"Quarterly Tax Reminder"` alert in MongoDB with the payment due date.
  * Complete Alerts CRUD and mark-as-read functionality (`PUT /api/alerts/:id/read`).

---

## 🔒 Security Best Practices Implemented

1. **Helmet.js**: Sets security HTTP headers to protect against common web vulnerabilities.
2. **CORS Configuration**: Configured with credentials support for frontend cross-origin requests.
3. **NoSQL Injection Protection**: Uses `express-mongo-sanitize` to strip invalid query operators.
4. **Rate Limiting**: Restricts IP requests (100 per 15 minutes) to protect against DDoS and brute-force attacks.
5. **JWT Authentication**: Protected endpoints verify JWT Bearer Tokens in headers or httpOnly cookies.
6. **Zod Validation**: Input validation interceptor blocks bad requests before reaching controllers.

---

## 🚀 Installation & Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taxpal_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES=15m
REFRESH_SECRET=your_jwt_refresh_secret
REFRESH_EXPIRES=7d
NODE_ENV=development
```

### Step 3: Run the Server

**Development Mode (Hot Reloading):**
```bash
npm run dev
```

**Build & Production Run:**
```bash
npm run build
npm start
```

---

## 📝 Complete API Reference

All protected routes require header: `Authorization: Bearer <JWT_TOKEN>`

### 🔑 1. Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Public | Register new user account |
| **POST** | `/login` | Public | Authenticate user & return JWT token |
| **POST** | `/refresh` | Public | Refresh JWT access token |
| **POST** | `/logout` | Authenticated | Logout user & revoke token |

### 💵 2. Transaction Routes (`/api/transactions`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Authenticated | Create income/expense transaction |
| **GET** | `/` | Authenticated | Get user transactions (supports category & type filter) |
| **GET** | `/category-summary` | Authenticated | Get transaction totals grouped by category |
| **GET** | `/chart-data` | Authenticated | Get dashboard monthly chart breakdown |
| **PUT** | `/:id` | Authenticated | Update transaction |
| **DELETE** | `/:id` | Authenticated | Delete transaction |

### 🎯 3. Budget Routes (`/api/budgets`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Authenticated | Set/update category monthly budget limit |
| **GET** | `/` | Authenticated | Get user budgets & spending progress |
| **DELETE** | `/:category` | Authenticated | Delete budget limit |

### 📁 4. Category Routes (`/api/categories`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Authenticated | Fetch default & custom categories |
| **POST** | `/` | Authenticated | Create custom category |

### 🧮 5. Tax Estimation Routes (`/api/tax-estimates`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Authenticated | Calculate & save quarterly tax estimate (Auto-generates reminder alert) |
| **GET** | `/` | Authenticated | Get user tax estimates history |
| **GET** | `/:id` | Authenticated | Get single tax estimate by ID |
| **PUT** | `/:id` | Authenticated | Update & recalculate tax estimate |
| **DELETE** | `/:id` | Authenticated | Delete tax estimate |

### 🔔 6. Alerts Routes (`/api/alerts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Authenticated | Create custom alert |
| **GET** | `/` | Authenticated | Get user alerts (sorted by date descending, optional `?isRead=true/false`) |
| **GET** | `/:id` | Authenticated | Get single alert by ID |
| **PUT** | `/:id/read` | Authenticated | Mark alert as Read (`isRead: true`) |
| **DELETE** | `/:id` | Authenticated | Delete alert |

---

## 📬 Standard Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```
