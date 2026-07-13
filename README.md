# 🎓 Automated Student Project Evaluation Hub

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-Sandbox-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge"/>
</p>

<p align="center">
<b>A Secure Full Stack Web Platform for Automated Student Project Evaluation, Custom Plagiarism Detection and Docker-Based Code Execution.</b>
</p>

---

# 📖 Overview

The **Automated Student Project Evaluation Hub** is a production-ready web application designed to simplify project submission, automated assessment, plagiarism detection, and secure code execution for educational institutions.

Instead of manually downloading, compiling, and reviewing hundreds of student projects, faculty members can evaluate submissions automatically while students receive instant feedback and detailed reports.

---

# ✨ Features

## 👥 Role-Based Authentication

✔️ JWT Authentication

✔️ Secure Password Encryption (bcrypt)

✔️ Role-based Dashboard

- 👑 Admin
- 👨‍🏫 Faculty
- 👨‍🎓 Student

---

## 📚 Assignment Management

- ➕ Create Assignments
- 📝 Rich Assignment Description
- 📅 Deadline Management
- 🎯 Marks Allocation
- 💻 Multi-language Support
- 📂 ZIP & GitHub Submission

Supported Languages

- C
- C++
- Java
- Python
- JavaScript

---

## ⚡ Automated Code Evaluation

Every submission goes through a secure evaluation pipeline.

```text
Student Submission
        │
        ▼
Upload ZIP / GitHub Repository
        │
        ▼
Compile Source Code
        │
        ▼
Execute inside Docker Sandbox
        │
        ▼
Run Public Test Cases
        │
        ▼
Run Hidden Test Cases
        │
        ▼
Compare Output
        │
        ▼
Generate Score
```

### Features

- 🐳 Docker Isolation
- ⏱️ Execution Timeout
- 💾 Memory Limits
- ⚙️ CPU Restrictions
- 🔒 Secure Execution
- 📊 Automatic Score Calculation

---

# 🕵️ Custom Plagiarism Detection

Unlike projects that rely on third-party APIs, this project includes a fully custom plagiarism detection engine.

### Detection Pipeline

```text
Source Code
      │
      ▼
Remove Comments
      │
      ▼
Normalize Tokens
      │
      ▼
Generate k-grams
      │
      ▼
Winnowing Fingerprints
      │
      ▼
Jaccard Similarity
      │
      ▼
Similarity Report
```

### Features

- ✅ Winnowing Algorithm
- ✅ Fingerprint Generation
- ✅ Token Normalization
- ✅ Jaccard Similarity
- ✅ Similar Submission Ranking
- ✅ Percentage-based Similarity Report

---

# 📊 Faculty Dashboard

Faculty members can

- 📈 View submission statistics
- 📊 Analyze class performance
- 📂 View plagiarism reports
- 📝 Review evaluation reports
- 📥 Export PDF Reports
- 🔔 Receive Notifications

---

# 👨‍🎓 Student Dashboard

Students can

- 📚 View Assignments
- 📤 Upload Projects
- 🧪 View Test Results
- 📄 Download Reports
- 📊 Check Marks
- 🔔 Receive Submission Status

---

# 👑 Admin Dashboard

Admin can

- 👥 Manage Users
- 🏫 Manage Departments
- 📚 Manage Courses
- 🔐 Control Permissions
- 📈 View Platform Analytics
- ⚙️ Configure System Settings

---

# 🎨 User Interface

Modern UI built using

- ⚛ React 18
- ⚡ Vite
- 🎨 Tailwind CSS
- 🎭 Framer Motion
- 📈 Chart.js

Features

- 🌙 Dark Mode
- 📱 Fully Responsive
- 💎 Glassmorphism
- ✨ Smooth Animations
- 🚀 Fast Loading

---

# 🏗 Tech Stack

| Category | Technology |
|------------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcrypt |
| File Upload | Multer |
| Charts | Chart.js |
| HTTP Client | Axios |
| Animations | Framer Motion |
| PDF Reports | PDFKit |
| Sandbox | Docker |
| Version Control | Git & GitHub |

---

# 📂 Project Structure

```text
Project Evaluation
│
├── client
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── features
│   │   ├── hooks
│   │   ├── layouts
│   │   ├── pages
│   │   ├── services
│   │   ├── utils
│   │   └── styles
│   │
│   ├── public
│   └── vite.config.js
│
└── server
    ├── config
    ├── controllers
    ├── middleware
    ├── models
    ├── routes
    ├── services
    ├── docker
    ├── uploads
    ├── utils
    └── server.js
```

---

# 🔐 Demo Accounts

| Role | Email | Password |
|-------|--------|----------|
| 👑 Admin | admin@neovika.com | Admin@123 |
| 👨‍🏫 Faculty | sarah.j@neovika.com | Faculty@123 |
| 👨‍🎓 Student | alex@student.com | Student@123 |

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/your-username/project-evaluation.git

cd project-evaluation
```

---

## Backend Setup

```bash
cd server

npm install
```

Create **.env**

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017/evaluationhub

JWT_SECRET=your-secret-key

JWT_EXPIRE=7d

NODE_ENV=development
```

Run Backend

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd client

npm install

npm run dev
```

---

# 🐳 Docker Sandbox

The execution pipeline follows

```text
Upload Submission
        │
        ▼
Create Temporary Docker Container
        │
        ▼
Compile Code
        │
        ▼
Execute Test Cases
        │
        ▼
Capture Output
        │
        ▼
Destroy Container
```

Benefits

- 🔒 Secure Execution
- 🚫 Prevent Infinite Loops
- 🧹 Temporary Environment
- 💾 Memory Isolation
- ⚡ Fast Evaluation

---

# 📄 Generated Reports

The system automatically generates

- 📊 Evaluation Report
- 📑 Submission Report
- 📈 Performance Report
- 📝 Plagiarism Report
- 📄 PDF Download

---

# 📸 Screenshots

> Add screenshots here

```
Home Page

Faculty Dashboard

Student Dashboard

Assignment Page

Evaluation Results

Plagiarism Report

Analytics Dashboard
```

---

# 📌 Future Enhancements

- 🤖 AI-based Code Review
- ☁ Cloud Deployment
- 📧 Email Notifications
- 📱 Mobile Application
- 🎥 Viva Scheduling
- 💬 Real-time Chat
- 🔗 GitHub Classroom Integration
- 📡 WebSocket Notifications

---

# 🤝 Contributing

Contributions are always welcome.

1. Fork this repository

2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Create Pull Request

---

# ⭐ Support

If you found this project useful,

⭐ Star this repository

🍴 Fork the repository

🛠 Contribute to improve it

---

# 📜 License

This project is licensed under the **MIT License**.

---

<p align="center">
Made with ❤️ using React • Node.js • MongoDB • Docker
</p>
