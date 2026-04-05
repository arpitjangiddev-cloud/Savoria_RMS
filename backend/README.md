# 🍽️ Restaurant Dashboard — Backend API

A complete REST API for a Restaurant Management Dashboard built with Node.js, Express, and MongoDB.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **File Upload:** Multer + Cloudinary
- **Logging:** Morgan

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, and Cloudinary credentials
```

### 3. Seed the database (optional)
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## Demo Credentials (after seeding)

| Role    | Email                       | Password   |
|---------|-----------------------------|------------|
| Admin   | admin@restaurant.com        | admin123   |
| Manager | manager@restaurant.com      | manager123 |
| Staff   | staff@restaurant.com        | staff123   |

---

## API Endpoints

### Auth
| Method | Endpoint                    | Access  | Description         |
|--------|-----------------------------|---------|---------------------|
| POST   | /api/auth/register          | Public  | Register new user   |
| POST   | /api/auth/login             | Public  | Login               |
| GET    | /api/auth/me                | Private | Get current user    |
| PUT    | /api/auth/update-password   | Private | Update password     |

### Menu
| Method | Endpoint                    | Access           | Description           |
|--------|-----------------------------|------------------|-----------------------|
| GET    | /api/menu                   | Private          | Get all items         |
| GET    | /api/menu/:id               | Private          | Get single item       |
| POST   | /api/menu                   | Admin/Manager    | Create item + image   |
| PUT    | /api/menu/:id               | Admin/Manager    | Update item + image   |
| DELETE | /api/menu/:id               | Admin            | Delete item           |
| PATCH  | /api/menu/:id/toggle        | Admin/Manager    | Toggle availability   |

### Orders
| Method | Endpoint                    | Access           | Description           |
|--------|-----------------------------|------------------|-----------------------|
| GET    | /api/orders                 | Private          | Get all orders        |
| GET    | /api/orders/:id             | Private          | Get single order      |
| POST   | /api/orders                 | Private          | Create order          |
| PATCH  | /api/orders/:id/status      | Private          | Update order status   |
| PATCH  | /api/orders/:id/payment     | Private          | Mark as paid          |
| DELETE | /api/orders/:id             | Admin/Manager    | Delete order          |

### Tables
| Method | Endpoint                    | Access           | Description           |
|--------|-----------------------------|------------------|-----------------------|
| GET    | /api/tables                 | Private          | Get all tables        |
| GET    | /api/tables/:id             | Private          | Get single table      |
| POST   | /api/tables                 | Admin/Manager    | Create table          |
| PUT    | /api/tables/:id             | Admin/Manager    | Update table          |
| DELETE | /api/tables/:id             | Admin            | Deactivate table      |
| PATCH  | /api/tables/:id/status      | Private          | Update table status   |

### Staff
| Method | Endpoint                    | Access           | Description           |
|--------|-----------------------------|------------------|-----------------------|
| GET    | /api/staff                  | Admin/Manager    | Get all staff         |
| GET    | /api/staff/:id              | Admin/Manager    | Get single staff      |
| POST   | /api/staff                  | Admin            | Create staff + user   |
| PUT    | /api/staff/:id              | Admin/Manager    | Update staff          |
| DELETE | /api/staff/:id              | Admin            | Deactivate staff      |

### Stats
| Method | Endpoint                    | Access  | Description              |
|--------|-----------------------------|---------|--------------------------|
| GET    | /api/stats/overview         | Private | KPIs and summary counts  |
| GET    | /api/stats/revenue?period=7 | Private | Revenue chart data       |
| GET    | /api/stats/top-items        | Private | Best-selling items       |
| GET    | /api/stats/category-sales   | Private | Sales by category        |
| GET    | /api/stats/recent-orders    | Private | Latest orders list       |

---

## Folder Structure
```
restaurant-backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── cloudinary.js      # Cloudinary + multer setup
├── controllers/
│   ├── authController.js
│   ├── menuController.js
│   ├── orderController.js
│   ├── tableController.js
│   ├── staffController.js
│   └── statsController.js
├── middleware/
│   └── auth.js            # JWT protect + authorize
├── models/
│   ├── User.js
│   ├── MenuItem.js
│   ├── Order.js
│   ├── Table.js
│   └── Staff.js
├── routes/
│   ├── auth.js
│   ├── menu.js
│   ├── orders.js
│   ├── tables.js
│   ├── staff.js
│   └── stats.js
├── utils/
│   └── seed.js            # Demo data seeder
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add all environment variables from `.env.example`
