# ✦ Ek Raaz Ki Baat Batau? — Tarot Reading Web App & Backend

A full-stack Tarot Reading application with a Node.js/Express server and MongoDB database integration.

---

## 🔮 Tech Stack & Architecture
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Celestial Dark Theme & Glassmorphism), Vanilla JavaScript (Fetch API)
- **Backend Architecture**: Layered MVC (Controllers, Middleware, Models, Routes, Config)
- **Database**: MongoDB (Connected via Mongoose with connection pooling and lifecycle monitoring)
- **Security & Reliability**:
  - `bcryptjs`: Password hashing with salt rounds
  - `jsonwebtoken`: Secure stateless JWT authentication
  - `helmet`: Comprehensive HTTP security headers (configured for CSP & Google Fonts)
  - `express-rate-limit`: Brute-force protection on auth endpoints and DoS mitigation on API routes
  - Centralized Error Handling: Sanitized error responses, Mongoose validation error formatting, duplicate key handling
  - Graceful Shutdown: Clean closing of HTTP listener and MongoDB connection on termination signals

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Installed on your system
- **MongoDB**: Installed and running locally (Service: `MongoDB` on port `27017`)

### 2. Configuration (`.env`)
The database and server configuration are managed inside `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tarot_reading
JWT_SECRET=your_jwt_secret_key_here
```
*(If you ever use MongoDB Atlas cloud in the future, simply replace `MONGO_URI` with your Atlas connection string!)*

### 3. Start the Server
```bash
npm start
```
Or:
```bash
node server/server.js
```

The application will be accessible at:
👉 **http://localhost:5000**

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user (hashed password & saved to MongoDB) | Public (Rate Limited) |
| `POST` | `/api/auth/login` | Authenticate user & return signed JWT token | Public (Rate Limited) |
| `GET` | `/api/auth/me` | Fetch logged-in user profile | Protected (Bearer Token) |
| `PUT` | `/api/auth/profile` | Update user's name or email | Protected (Bearer Token) |
| `PUT` | `/api/auth/change-password` | Verify current password and update to new password | Protected (Bearer Token) |

### 🔮 Appointments (`/api/appointments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/appointments` | Book a tarot session (validates future date & saves to MongoDB) | Public / User |
| `GET` | `/api/appointments/my` | Retrieve all appointments for the logged-in user | Protected (Bearer Token) |
| `GET` | `/api/appointments` | Query appointments | User / Admin |
| `PATCH` | `/api/appointments/:id/cancel` | Cancel an existing appointment | Owner / Admin |

### 🩺 Health Check (`/api/health`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns server status, uptime, and MongoDB connection state |

---

## 📁 Project Architecture
```
Tarot-reading/
├── .env                              # Environment variables (DB URI, JWT secret, Port)
├── .gitignore                        # Git ignore rules for node_modules and .env
├── package.json                      # Backend dependencies & npm start script
├── index.html                        # Landing page & cosmic service showcase
├── appointment.html                  # Booking interface + "My Bookings" MongoDB viewer
├── login.html                        # User login portal
├── signup.html                       # User registration portal
├── style.css                         # Celestial design system, stars, & animations
├── main.js                           # Frontend logic, starfield canvas, & API integration
└── server/
    ├── server.js                     # Express app setup, security, logging, & static hosting
    ├── config/
    │   └── db.js                     # Resilient MongoDB Mongoose connection & lifecycle
    ├── controllers/
    │   ├── authController.js         # Signup, login, profile, & password management
    │   └── appointmentController.js  # Booking creation, user bookings query, & cancellation
    ├── middleware/
    │   ├── auth.js                   # JWT protection & optional user attachment
    │   ├── errorHandler.js           # Centralized exception & Mongoose error handler
    │   └── rateLimiter.js            # Brute force protection & API rate limiters
    ├── models/
    │   ├── User.js                   # User Mongoose model with bcrypt hook & validation
    │   └── Appointment.js            # Appointment Mongoose model with validation & indexes
    └── routes/
        ├── auth.js                   # Authentication routes
        └── appointments.js           # Appointment routes
```
