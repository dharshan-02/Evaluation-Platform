# 🎓 Automated Student Project Evaluation Hub

A production-quality full-stack web application designed for automated student project evaluation. It features custom plagiarism detection (Winnowing fingerprinting) and secure Docker-based code execution.

## 🌟 Key Features

### 👥 Role-Based Access Control
- **Admin**: Full system control, user management, and global settings.
- **Faculty**: Create assignments, define test cases, view student submissions, and analyze plagiarism reports.
- **Student**: View assignments, submit projects (ZIP or GitHub link), and view evaluation results.

### 📝 Assignment Management
- **Creation**: Faculty can create detailed assignments with descriptions, deadlines, and points.
- **Test Cases**: Define input/output test cases (public and hidden) for automated grading.
- **Languages**: Support for C, C++, Python, Java, and JavaScript.

### 🚀 Secure Code Execution Sandbox
- **Docker Integration**: Executes submitted code in isolated Docker containers.
- **Resource Limits**: Configurable memory, CPU, and execution time limits to prevent abuse.
- **Automated Pipeline**: Compile → Execute → Compare Output → Score.

### 🕵️ Plagiarism Detection
- **Custom Engine**: Uses the Winnowing algorithm with Jaccard similarity for robust fingerprinting.
- **No External Dependencies**: 100% in-house plagiarism detection engine.
- **Detailed Reports**: Visual comparison of similar code segments across student submissions.

### 📊 Analytics & Reporting
- **Dashboards**: Real-time charts and statistics for class performance tracking using Chart.js.
- **PDF Reports**: Downloadable evaluation and plagiarism reports generated via PDFKit.
- **Notifications**: Real-time bell notifications for submission status and assignment updates.

### 🎨 Modern & Responsive UI
- Built with React 18, Vite, and Tailwind CSS.
- Features Dark Mode, glassmorphism design elements, and fluid animations using Framer Motion.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Chart.js, React Router, Axios |
| **Backend** | Node.js, Express.js, JWT, bcrypt, Multer |
| **Database** | MongoDB with Mongoose |
| **Execution Sandbox** | Docker, Shell scripting |
| **PDF Generation** | PDFKit |

---

## 🏗️ Project Architecture

```text
Project Evaluation/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Shared UI components (Button, Modal, Sidebar, etc.)
│   │   ├── features/          # Feature-driven modules (auth, dashboard, assignments)
│   │   ├── hooks/             # Shared hooks (useAuth, useApi, etc.)
│   │   ├── layouts/           # DashboardLayout, AuthLayout
│   │   ├── lib/               # Axios instance, constants
│   │   ├── pages/             # Route-level page components
│   │   └── styles/            # Global CSS, Tailwind directives
│   └── vite.config.js
│
└── server/                    # Express.js backend
    ├── config/                # DB and environment configuration
    ├── controllers/           # Route handlers for business logic
    ├── middleware/            # Auth, validation, upload (Multer)
    ├── models/                # Mongoose schemas (User, Assignment, Submission)
    ├── routes/                # Express API routes
    ├── services/              # Execution, Plagiarism, Evaluation logic
    ├── docker/                # Sandbox Dockerfile & Entrypoint scripts
    └── server.js              # Application entry point
```

---

## 🔑 Demo Credentials

Use these credentials to explore the different roles in the application:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@eval.hub` | `Admin@123` |
| **Faculty** | `faculty@eval.hub` | `Faculty@123` |
| **Student** | `student@eval.hub` | `Student@123` |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18+ LTS recommended)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Docker Desktop** (Required for the code execution sandbox)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd "Project Evaluation"
   ```

2. **Setup the Backend Server**
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/eval-hub  # Or your Atlas URI
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Setup the Frontend Client**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

You will need two separate terminal windows/tabs to run the frontend and backend simultaneously.

**Terminal 1: Start the Backend**
```bash
cd server
npm run dev
```

**Terminal 2: Start the Frontend**
```bash
cd client
npm run dev
```

The frontend will typically be accessible at `http://localhost:5173` and the backend API at `http://localhost:5000`.

---

## 🐳 Docker Sandbox Setup (For Faculty/Admin)

The core feature of this platform is its secure execution environment. When a student submits code:
1. The backend spins up a temporary Docker container using the `server/docker/Dockerfile.sandbox`.
2. The submitted code and test cases are mounted into the container.
3. The code is compiled (if applicable) and executed against the test cases.
4. Outputs are captured, compared against expected results, and the container is immediately destroyed.

*Note: Ensure Docker Desktop is running before evaluating submissions to prevent connection errors.*

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
