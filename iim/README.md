# 📦 Internal Inventory Management System (IIM)

A full-stack web application for managing internal inventory using **QR Code technology**. The system supports role-based access for **Admin** and **Staff**, enabling efficient stock tracking, QR code generation/scanning, and real-time inventory reporting.

> This is a merged single-port application combining:
> - **Home** — Landing page (`/`)
> - **Admin Dashboard** — (`/admin`)
> - **Staff Dashboard** — (`/staff`)

---

## 🌟 Features

### 👑 Admin
- 📊 Dashboard with real-time inventory overview and charts
- ➕ Add, View, Update, and Delete inventory items
- 📷 Generate QR Codes for inventory items
- 🔍 Scan QR Codes to instantly fetch item details
- 🗂️ Manage product categories (Create, Update, Activate/Deactivate)
- 📦 Stock In / Stock Out management with history tracking
- 🏭 Supplier management (Add, Edit, Delete suppliers)
- 👥 Manage staff accounts
- 📄 Generate Inventory Reports & Low Stock Reports (Export to Excel)
- 🎨 Customize panel for UI preferences
- 👤 Admin profile management with photo upload

### 👷 Staff
- 🔍 Scan QR Codes to view item details instantly
- 📋 View current inventory
- 📦 Perform Stock In / Stock Out operations
- 📜 View personal stock transaction history
- ⚠️ View low stock alerts
- 👤 Staff profile management

### 🔐 Security
- JWT-based authentication
- Role-based access control (Admin / Staff)
- Email OTP verification on registration

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 + TypeScript | UI Framework |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Material UI (MUI) | UI Components |
| Framer Motion | Animations |
| Recharts | Dashboard Charts |
| QRCode.react | QR Code Generation |
| jsQR | QR Code Scanning |
| Axios | API Communication |
| React Router DOM v7 | Client-side Routing |
| ExcelJS + FileSaver | Export Reports to Excel |
| Lenis | Smooth Scrolling |

### Backend
| Technology | Purpose |
|------------|---------|
| Java 21 | Programming Language |
| Spring Boot 4.0.3 | Backend Framework |
| Spring Security + JWT | Authentication & Authorization |
| Spring Data JPA | Database ORM |
| MySQL | Relational Database |
| Google ZXing 3.5.3 | QR Code Generation (Server-side) |
| Spring Mail | Email OTP Service |
| Lombok | Boilerplate Reduction |
| Gradle | Build Tool |

---

## 📁 Project Structure

```
inventory-management-system/
├── IIM-Frontend/               # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/          # Home, Inventory, QR Code, Stock, Reports, Suppliers, Staff
│   │   │   └── Staff/          # Home, Inventory, QR Code, Stock, LowStock
│   │   ├── pages/              # LoginPage, SignupPage, ForgotPasswordPage
│   │   ├── sections/           # Landing page sections
│   │   └── App.tsx             # Main Router
│   └── package.json
│
└── IIM-Backend/                # Spring Boot Backend
    └── iim/
        └── src/main/java/com/iim/iim/
            ├── controller/     # AdminController, StaffController, AuthController
            ├── service/        # Business Logic Layer
            ├── repository/     # JPA Repositories
            ├── entity/         # Item, Category, Supplier, User, StockTransaction
            ├── dto/            # Data Transfer Objects
            └── config/         # JWT Filter, Security Config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Java 21
- MySQL 8+
- Gradle

---

### 💻 Frontend Setup

```bash
cd IIM-Frontend
npm install
npm run dev
```

The app will run at **http://localhost:5073**

---

### 🔧 Backend Setup

**1. Configure MySQL — rename `application.yaml.example` to `application.yaml`:**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/iim_db?createDatabaseIfNotExist=true
    username: YOUR_DB_USERNAME
    password: YOUR_DB_PASSWORD
  mail:
    username: YOUR_EMAIL@gmail.com
    password: YOUR_GMAIL_APP_PASSWORD
jwt:
  secret: YOUR_JWT_SECRET_KEY
```

**2. Run the Backend:**

```bash
cd IIM-Backend/iim
./gradlew bootRun
```

Backend runs at: **http://localhost:8080**

---

## 🗺️ Routes

| Path | Role | Description |
|------|------|-------------|
| `/` | Public | Home / Landing page |
| `/login` | Public | Login page |
| `/signup` | Public | Signup page |
| `/admin` | Admin | Admin Dashboard |
| `/admin/inventory/view` | Admin | View Inventory |
| `/admin/inventory/add` | Admin | Add Inventory |
| `/admin/inventory/manage` | Admin | Manage Inventory |
| `/admin/QRcode/Create` | Admin | Generate QR Code |
| `/admin/QRcode/Scan` | Admin | Scan QR Code |
| `/admin/categories/manage` | Admin | Manage Categories |
| `/admin/stock/in-out` | Admin | Stock In/Out |
| `/admin/stock/history` | Admin | Stock History |
| `/admin/reports/inventory` | Admin | Inventory Report |
| `/admin/reports/low-stock` | Admin | Low Stock Report |
| `/admin/users/manage` | Admin | Manage Staff |
| `/admin/settings/profile` | Admin | Admin Profile |
| `/staff` | Staff | Staff Dashboard |
| `/staff/QRcode/Scan` | Staff | Scan QR Code |
| `/staff/inventory/view` | Staff | View Inventory |
| `/staff/stock/in` | Staff | Stock In |
| `/staff/stock/out` | Staff | Stock Out |
| `/staff/stock/history` | Staff | Stock History |
| `/staff/lowstock/items` | Staff | Low Stock Items |
| `/staff/settings/profile` | Staff | Staff Profile |

---

## 🔄 App Flow

1. Open `http://localhost:5073` → Home page
2. Click **Log In** or **Get Started** → Login / Signup
3. After login → **Go to Admin Dashboard** (`/admin`)
4. Or → **Go to Staff Dashboard** (`/staff`)

---

## 🧪 Sample Login (Demo Mode)

| Field | Value |
|-------|-------|
| Email | `arjun.sharma@company.in` |
| Password | Any 6+ character password |
| OTP | Any 6-digit number |

---

## 🖼️ Screenshots

### 🏠 Home Page
![Home Page](screenshots/01-home-page.png)

### 🚀 Get Started Page
![Get Started](screenshots/02-get-started.png)

### 👑 Admin Dashboard
![Admin Dashboard](screenshots/03-admin-dashboard.png)

### 👷 Staff Dashboard
![Staff Dashboard](screenshots/04-staff-dashboard.png)

> 📁 Screenshots are in the `screenshots/` folder of this repository.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (returns JWT token) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/item/fetchAll` | Get all inventory items |
| POST | `/api/admin/item/save` | Add new item |
| PUT | `/api/admin/item/update` | Update item |
| DELETE | `/api/admin/item/deleteByid` | Delete item |
| GET | `/api/admin/category/fetchAll` | Get all categories |
| POST | `/api/admin/category/save` | Add category |
| POST | `/api/admin/stock/save` | Save stock transaction |

---

## 👨‍💻 Developer

**Maadhesh**
- GitHub: [github.com/TheMaadhesh](https://github.com/TheMaadhesh)

---

## 📄 License

This project is intended for internal / academic use.
