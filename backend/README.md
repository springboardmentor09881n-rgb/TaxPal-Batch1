# Salary Management Backend API

A production-ready, highly secure, and scalable backend for a Salary Management System. Built using **Node.js**, **Express.js**, **TypeScript**, and **MongoDB/Mongoose**, this project implements **Clean Architecture** and the **MVC (Model-View-Controller)** pattern.

---

## 🏗️ Architecture & Folder Structure

The project follows a modular MVC architecture:

```text
backend/
├── src/
│   ├── config/          # Configuration files (Database, env schema, winston logger)
│   ├── controllers/     # Controller layer (Receives request, delegates to services, returns response)
│   ├── middleware/      # Middleware layer (Auth, custom roles, errors, validation, uploads)
│   ├── models/          # Mongoose database models with strict TypeScript interfaces
│   ├── routes/          # Express route definitions mapped to controllers
│   ├── services/        # Service layer (Contains all business logic, DB actions, calculations)
│   ├── types/           # Global type declarations and Express override modules
│   ├── utils/           # Utility helpers (Custom API errors/responses, token signing, constants)
│   ├── validators/      # Zod validation schemas to block invalid requests at the gate
│   ├── app.ts           # Express Application setup and middleware pipeline config
│   └── server.ts        # Server entry point, database connection and port listening
├── .env                 # Environment variables config (contains sensitive credentials)
├── .env.example         # Example template for environment config
├── .gitignore           # Ignored git files (node_modules, .env, dist)
├── package.json         # Project manifests and dependency configurations
├── tsconfig.json        # TypeScript compiler configurations
├── nodemon.json         # Nodemon watcher configurations for development
├── eslint.config.js     # ESLint code checks configurations
├── prettier.config.js   # Prettier code styling configurations
└── README.md            # Backend documentation
```

---

## 🔒 Security Best Practices Implemented

To ensure a production-ready standard, the backend includes:
1. **Helmet.js**: Sets security HTTP headers to protect against common web vulnerabilities (X-Frame-Options, X-Content-Type-Options, clickjacking, etc.).
2. **CORS Configuration**: Restricted cross-origin resource sharing configured with credential flags enabled.
3. **NoSQL Injection Protection**: Uses `express-mongo-sanitize` to strip characters (like `$` or `.`) from inputs to prevent NoSQL query inject attacks.
4. **Rate Limiting**: Configured `express-rate-limit` to restrict clients to `100` API requests every 15 minutes to prevent DDoS or brute-force attempts.
5. **Secure Authentication**: Passwords hashed using `bcrypt` (10 rounds). Tokens managed using JWT with short-lived access tokens (15m) and secure refresh tokens (7d).
6. **Robust Validation**: Zod validators intercept requests before controllers, returning detailed status `400` errors for invalid formatting.

---

## 🚀 Installation & Quick Start

### Prerequisites
- Node.js (v18.x or above recommended)
- MongoDB running locally (e.g., `mongodb://localhost:27017`) or a MongoDB Atlas Cloud URI.

### Step 1: Install Dependencies
Navigate to the `backend/` directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root `backend/` directory and configure the variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/salary-management
JWT_SECRET=your_jwt_access_secret_key
JWT_EXPIRES=15m
REFRESH_SECRET=your_jwt_refresh_secret_key
REFRESH_EXPIRES=7d
NODE_ENV=development
```

### Step 3: Run the Server

**Development Mode (Hot Reloading via Nodemon):**
```bash
npm run dev
```

**Production Build and Run:**
```bash
# Compile TypeScript to JavaScript
npm run build

# Start Compiled Production Server
npm start
```

You should see:
```text
MongoDB Connected: localhost
Server successfully started in development mode on port 5000
```

---

## 📝 API Endpoints & Role-Based Access Control (RBAC)

All API requests under protected endpoints must provide the JWT Access Token in one of the following formats:
- In the `Authorization` header: `Bearer <JWT_ACCESS_TOKEN>`
- In the request cookies: `accessToken=<JWT_ACCESS_TOKEN>`

### User Roles
- **Admin**: Full read/write access to all collections and profiles.
- **HR**: CRUD access to Employees and Salary records.
- **Manager**: Read-only access to Employee profiles, and access to approve/reject salary payment statuses.
- **Employee**: Can read their own employee profile and retrieve their own salary logs.

---

### 🔑 Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/register` | Public | Registers a new account. Defaults to `Employee` role. | `{"email": "user@ex.com", "password": "password123", "role": "Employee"}` |
| **POST** | `/login` | Public | Validates credentials and returns JWT credentials in JSON + http-only cookies. | `{"email": "user@ex.com", "password": "password123"}` |
| **POST** | `/refresh` | Public | Rotates tokens using the refresh token (sent in body or cookie) and returns a new token pair. | `{"refreshToken": "<REFRESH_TOKEN>"}` |
| **POST** | `/logout` | Authenticated | Revokes the active refresh token and clears client cookies. | `{"refreshToken": "<REFRESH_TOKEN>"}` |

---

### 👤 User Profile Routes (`/api/users`)

All routes require **Authentication**.

| Method | Endpoint | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/profile` | Any Authenticated | Retrieve authenticated user profile credentials. | *None* |
| **PUT** | `/profile` | Any Authenticated | Updates self profile email details. | `{"email": "new-email@ex.com"}` |
| **POST** | `/change-password` | Any Authenticated | Modifies account password (invalidates other active sessions). | `{"oldPassword": "password123", "newPassword": "newSecurePassword123"}` |
| **DELETE** | `/:id` | Admin, HR | Deletes a user account and their linked employee profile. | *None (Id parameter in URL)* |

---

### 📋 Employee Profiles Routes (`/api/employees`)

All routes require **Authentication**.

| Method | Endpoint | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/me` | Any Authenticated | Fetch Employee profile linked to the active user account. | *None* |
| **GET** | `/:id` | Admin, HR, Manager, Owner | Fetch a single employee profile details. Owners can only fetch self profiles. | *None* |
| **GET** | `/` | Admin, HR, Manager | Retrieve list of employees. Supports query strings: `?department=Engineering`, `?status=Active`, `?search=John`. | *None* |
| **POST** | `/` | Admin, HR | Create employee profile linking it to a user. | `{"userId": "24h_user_id", "name": "John Doe", "email": "john@ex.com", "phone": "1234567890", "department": "IT", "designation": "Developer", "joiningDate": "2026-07-01T00:00:00.000Z", "salary": 60000, "status": "Active"}` |
| **PUT** | `/:id` | Admin, HR | Updates a specific employee profile. | `{"department": "Sales", "salary": 65000}` |
| **DELETE** | `/:id` | Admin, HR | Deletes employee profile and linked user credentials. | *None* |

---

### 💵 Salary Records Routes (`/api/salary`)

All routes require **Authentication**.

| Method | Endpoint | Access | Description | Request Body Example |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/me` | Any Authenticated | Retrieve salary history for the logged-in employee. | *None* |
| **GET** | `/:id` | Admin, HR, Manager, Owner | Retrieve single salary details. Owners can only fetch their own salary logs. | *None* |
| **GET** | `/` | Admin, HR, Manager | Fetch all salary logs. Filters supported: `?employeeId=id`, `?month=7`, `?year=2026`, `?paymentStatus=Pending`. | *None* |
| **POST** | `/` | Admin, HR | Creates a salary record (auto computes `netSalary`). Checks and blocks duplicate months. | `{"employeeId": "24h_employee_id", "basicSalary": 50000, "allowances": 5000, "bonus": 2000, "deductions": 1000, "month": 7, "year": 2026, "paymentStatus": "Pending"}` |
| **PUT** | `/:id` | Admin, HR | Updates salary numbers (triggers net salary auto-recalculation). | `{"bonus": 4000, "deductions": 500}` |
| **PATCH**| `/:id/approve` | Admin, Manager | Approves or rejects salary payment status. If approved or paid, stamps the current date. | `{"paymentStatus": "Approved"}` |
| **DELETE** | `/:id` | Admin, HR | Deletes a salary record. | *None* |

---

## 📬 Standard Response Formats

### Successful Response Format (HTTP Status 200/201)
```json
{
  "success": true,
  "message": "Salary record created successfully",
  "data": {
    "_id": "603f9a72dfa3e42ea84b5c77",
    "employeeId": "603f9a52dfa3e42ea84b5c75",
    "basicSalary": 50000,
    "allowances": 5000,
    "bonus": 2000,
    "deductions": 1000,
    "netSalary": 56000,
    "month": 7,
    "year": 2026,
    "paymentStatus": "Pending",
    "createdAt": "2026-07-04T12:00:00.000Z",
    "updatedAt": "2026-07-04T12:00:00.000Z"
  }
}
```

### Error Response Format (HTTP Status 400/401/403/404/500)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "basicSalary",
      "message": "Basic salary cannot be negative"
    }
  ]
}
```

---

## 🛠️ Code Verification & Testing Checks

### Running Linting Config
```bash
npm run lint
```

### Running Formatter Code
```bash
npm run format
```

### Running the Smoke test Verification Script
A structure validation smoke test resides under `.gemini/antigravity-ide/brain/f1d9d7fb-3f96-4953-be11-13d40fb98192/scratch/smoke_test.ts`. This verifies code dependencies and Mongoose schemas compile cleanly without runtime circular reference blocks.
