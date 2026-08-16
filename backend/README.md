# TaxPal: Personal Finance & Tax Estimator Backend API

A secure, robust, and scalable MVC-structured REST API backend for the **TaxPal** personal finance and tax estimator platform. Built using **Node.js**, **Express.js**, **TypeScript**, and **MongoDB/Mongoose**, it provides complete endpoints for user management, transaction logging, budgeting constraints, tax calculations, and reminder alerts.

---

## 🏗️ Folder Structure

The backend workspace is structured as follows:

```text
backend/
├── src/
│   ├── config/          # Configurations (Database connection, environment validation, winston logger)
│   ├── controllers/     # Controller layer (Receives requests, delegates actions to services, returns responses)
│   ├── middleware/      # Middleware filters (Authentication, validation, error handler)
│   ├── models/          # Mongoose database models with strict TypeScript interfaces
│   ├── routes/          # Express route mappings connecting paths to controllers
│   ├── services/        # Service layer containing core calculations and database CRUDs
│   ├── types/           # Custom TypeScript declarations and module overrides
│   ├── utils/           # Shared utility classes (ApiError, ApiResponse, taxCalculator)
│   ├── validators/      # Zod validation schemas for checking request payloads
│   ├── app.ts           # Express Application setup and pipeline configuration
│   └── server.ts        # Main entry point (starts server and connects database)
├── .env.example         # Example template for environment configurations
├── package.json         # Project metadata, script commands, and dependencies
├── tsconfig.json        # TypeScript compiler configurations
├── nodemon.json         # Nodemon watcher configuration for hot reloads
├── eslint.config.js     # ESLint code linting specifications
└── README.md            # Backend API documentation (this file)
```

---

## 🔒 Implemented Security Protocols

To ensure data integrity and system security, the API implements:
1. **Helmet.js**: Sets security HTTP headers to protect against clickjacking, script injection, and sniffing.
2. **CORS credentials configuration**: Secure cross-origin requests matching authenticated client origins.
3. **NoSQL Injection Defense**: Uses `express-mongo-sanitize` to strip query parameter syntax injection attempts.
4. **API Rate Limiting**: Restricts clients to `100` requests per 15-minute window to mitigate DDoS attempts.
5. **Secure Cryptography**: Password hashing using `bcrypt` (10 rounds) and state-of-the-art token security using JSON Web Tokens (Access token cookie expires in 15m; rotating Refresh token in body/cookie expires in 7d).
6. **Payload Guard**: Zod schemas validate request syntax before they enter the controllers.

---

## 🔑 Route References & Endpoint Directory

All protected routes require a valid JWT Access Token provided in:
- The `Authorization` header: `Bearer <JWT_ACCESS_TOKEN>`
- The request cookies: `accessToken=<JWT_ACCESS_TOKEN>`

### 1. Authentication & Profile (`/api/auth`)
- `POST /register`: Registers a new account. Expects: `email`, `password`, `fullName`, `username`, `country`, and optional `state`/`city`.
- `POST /login`: Validates credentials, issues access/refresh tokens in secure cookies + JSON body.
- `POST /refresh`: Rotates refresh tokens and issues a new access token.
- `POST /logout`: Revokes refresh tokens and clears client cookies.
- `GET /profile`: Retrieves the profile of the currently logged-in user.
- `PUT /profile`: Updates user settings (name, phone, state, auto-categorize config, categoryMappings, etc.).

### 2. Transactions (`/api/transactions`)
- `POST /`: Records a new transaction (Income or Expense). Expects: `type`, `description`, `category`, `amount`, `transactionDate`, and optional `notes`.
- `GET /`: Lists all transactions for the user (supports date range and keyword filtering).
- `GET /:id`: Retrieves a single transaction record by ID.
- `PUT /:id`: Edits an existing transaction.
- `DELETE /:id`: Deletes a transaction record.

### 3. Category Budgets (`/api/budgets`)
- `GET /`: Fetches all set category budgets alongside the dynamically calculated aggregate spent amounts for the current month.
- `POST /`: Sets or updates a spending budget limit for a category. Expects: `category`, `limit`, and optional `month` (format `YYYY-MM`) and `description`.
- `DELETE /:category`: Removes budget constraints for a category.

### 4. Custom Categories (`/api/categories`)
- `GET /`: Returns custom categories created by/for the user.
- `GET /type/:type`: Filters custom categories by type (`income` or `expense`).
- `POST /`: Registers a new custom category. Expects: `name`, `type`, and optional custom `color` (hex string) and `icon` selector.
- `PUT /:categoryId`: Modifies custom category properties.
- `DELETE /:categoryId`: Removes custom category.
- `POST /initialize-default`: Instantly seeds the initial set of default system categories for the user.

### 5. Tax Estimations (`/api/tax-estimates`)
- `GET /`: Lists all previously computed tax calculations.
- `POST /`: Records a quarterly tax calculation. Expects: `country`, `state` (if India/US/CA/AU), `quarter` (`Q1`-`Q4`), `grossIncomeForQuarter`, `businessExpenses`, `retirementContribution`, `healthInsurancePremiums`, `homeOfficeDeduction`, and `estimatedTax`.
- `GET /:id`: Gets a single estimation details by ID.
- `PUT /:id`: Updates calculation metrics.
- `DELETE /:id`: Deletes tax estimate details.

### 6. Notifications & Alerts (`/api/alerts`)
- `GET /`: Retrieves alerts (unread and read logs).
- `POST /`: Manually creates a new alert notification.
- `PUT /:id/read`: Marks a specific alert as read.
- `DELETE /:id`: Dismisses/removes a notification.

---

## ⚙️ Getting Started & Setup

### Setup Environment Configuration
Create a `.env` file in the root `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taxpal
JWT_SECRET=your_jwt_access_secret_key
JWT_EXPIRES=15m
REFRESH_SECRET=your_jwt_refresh_secret_key
REFRESH_EXPIRES=7d
NODE_ENV=development
```

### Install Modules
```bash
npm install
```

### Execution Scripts
- **Development (nodemon + hot-reloading)**:
  ```bash
  npm run dev
  ```
- **Production Compilation**:
  ```bash
  npm run build
  ```
- **Production Start**:
  ```bash
  npm start
  ```
- **Linter & Formatter**:
  ```bash
  npm run lint
  npm run format
  ```
