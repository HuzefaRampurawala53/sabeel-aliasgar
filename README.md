# Moharram Sabeel Expense & Contribution Management Web App

✦ **Sabeel E Aliasgar Management Portal** ✦

A modern, mobile-responsive full-stack web application designed to manage the finances, expenses, and contributions of a 10-day Moharram Sabeel project serving 20–25 volunteer members.

---

## 🚀 Quick Start

1.  **Start Dev Servers (Frontend + Backend):**
    Open your terminal in the root project folder (`c:\Users\ADMIN\Desktop\Sabeel E Aliasgar`) and run:
    ```bash
    npm run dev
    ```
    This command runs concurrently:
    *   **Frontend Client:** `http://localhost:3000` (React UI)
    *   **Backend Server:** `http://localhost:5000` (API & SQLite Database)

2.  **Access Portals:**
    *   **Gateway Landing Page:** `http://localhost:3000`
    *   **Member Login Route:** `http://localhost:3000/login`
    *   **Admin Login Route:** `http://localhost:3000/admin/login`

---

## 🔑 Test Credentials

The database comes pre-seeded with default users for instant evaluation:

### 👤 Volunteer (Member) Accounts
*   **Username:** `member_a` (Contribution: ₹10,000)
*   **Username:** `member_b` (Contribution: ₹20,000)
*   **Password:** `member123`

### 🛡️ Admin (Organizer) Account
*   **Username:** `admin`
*   **Password:** `admin123`

---

## 🎨 Theme & Design Aesthetics
*   **Color Palette:** Moharram Deep Crimson (`#7A0C0C` / `#4A0202`) combined with Sabeel Emerald Green (`#065F46` / `#047857`) on a clean alabaster cream background (`#FAF9F6`).
*   **Geometric Layouts:** Injected subtle Islamic geometric SVG patterns into headers and card backings for authentic styling.
*   **Dark Mode Support:** Smooth toggles on both dashboards for late-night volunteer runs during the 10 days of Moharram.
*   **Mobile-First Responsive Layout:** Large touch-friendly input fields and clean tables for volunteers logging purchases on the go.

---

## 💡 Key Features Implemented

1.  **Separated Gateways:** Members and admins access the application from distinct login pages to prevent role spill.
2.  **Dynamic Financial Settlements:** Calculates differences automatically:
    $$\text{Settlement Amount} = \text{Total Approved Expenses} - \text{Contribution Amount}$$
    *   *Positive:* Displays as "Receive ₹X" (refundable from Sabeel reserves).
    *   *Negative:* Displays as "Refund Pending ₹Y" (owing balance back to the project).
3.  **Bill Voucher Submission:** Members log expenses with category tags, vendor details, and upload receipts/screenshots for online transactions.
4.  **Admin Verification Queue:** Organizers audit vouchers, inspecting PDF/image uploads, and approve or reject submissions in real-time.
5.  **Analytics Charts:** Live dashboard line charts mapping daily expenses against contributions, plus pie chart category breakdown.
6.  **Daily Financial Summaries:** Automatic calculation of Day 1 through Day 10 opening balance, daily intake/outflow, and closing logs.
7.  **Excel & CSV Reporting:** Admin-only downloads that generate spreadsheet lists dynamically.
8.  **Database Backups:** Local JSON export and restoration utility to avoid data loss.

---

## 📂 Project Structure

```
Sabeel E Aliasgar/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database & seed setups (db.js)
│   │   ├── controllers/    # Request handlers (auth, expenses, admin, reports)
│   │   ├── middleware/     # JWT Auth, Multer File Uploads
│   │   ├── routes/         # Express endpoints
│   │   └── index.js        # Server main file
│   └── package.json
├── frontend/               # Vite + React Client
│   ├── src/
│   │   ├── components/     # Route guards, loaders
│   │   ├── context/        # Session context (AuthContext.jsx)
│   │   ├── pages/          # Gateway, member pages, admin pages
│   │   ├── App.jsx         # Routes map
│   │   ├── index.css       # Tailwind v4 configuration
│   │   └── main.jsx
│   └── package.json
├── uploads/                # Directory storing payment receipt proofs
├── package.json            # Root workspaces run scripts
└── README.md
```
