# Automated Student Project Evaluation Hub

A production-quality full-stack web application for automated student project evaluation with custom plagiarism detection and secure Docker-based code execution.

## Features

- **Role-Based Access**: Admin, Faculty, and Student dashboards
- **Assignment Management**: Create, manage, and publish assignments with test cases
- **Project Submission**: Upload ZIP files or link GitHub repositories
- **Secure Code Execution**: Docker sandbox with resource limits and timeouts
- **Plagiarism Detection**: Custom Winnowing fingerprinting engine (no external services)
- **Automatic Evaluation**: Compile → Execute → Compare → Score pipeline
- **Analytics**: Charts and statistics for performance tracking
- **PDF Reports**: Downloadable evaluation and plagiarism reports
- **Notifications**: Real-time notification system
- **Modern UI**: Dark mode, glassmorphism, animations with Framer Motion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |
| Execution | Docker sandbox |
| Reports | PDFKit |

## Getting Started

### Prerequisites

- Node.js 18+ LTS
- MongoDB (local or Atlas)
- Docker Desktop
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "Project Evaluation"

# Install server dependencies
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Install client dependencies
cd ../client
npm install

# Start development servers
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eval-hub
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
NODE_ENV=development
```

## Project Structure

```
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── features/      # Feature modules
│   │   ├── hooks/         # Custom hooks
│   │   ├── layouts/       # Page layouts
│   │   ├── lib/           # Utilities, API client
│   │   └── pages/         # Route pages
│   └── ...
├── server/          # Express.js backend
│   ├── config/      # DB and env config
│   ├── controllers/ # Route handlers
│   ├── middleware/   # Auth, validation, upload
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── docker/      # Sandbox Dockerfile
│   └── ...
└── README.md
```

## License

MIT
