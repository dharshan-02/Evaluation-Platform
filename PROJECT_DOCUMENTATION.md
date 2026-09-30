# Capstone Project Evaluation System

A comprehensive, enterprise-grade platform built to streamline the evaluation, execution, and plagiarism detection of academic coding assignments and capstone projects. The platform provides a seamless experience for students to submit work and for faculty to evaluate it via manual grading or automated processing.

## 🛠 Technology Stack

### Frontend
- **React.js & Vite:** High-performance UI development and fast build tooling.
- **TailwindCSS:** Utility-first styling for modern, premium, glass-morphic SaaS aesthetics.
- **Framer Motion:** Used for smooth page transitions and micro-animations.
- **React Router:** For secure, role-based client-side routing.
- **Socket.IO Client:** For real-time updates and notifications.

### Backend
- **Node.js & Express.js:** Scalable RESTful API architecture.
- **MongoDB & Mongoose:** NoSQL document database for flexible schema definitions.
- **Socket.IO:** Event-driven architecture for real-time bidirectional communication.
- **Child_Process & Docker API:** For executing untrusted student code in isolated sandbox environments.

---

## 🏛 System Architecture

The platform follows a standard client-server architecture with real-time websocket extensions.

1. **Client Layer (SPA):** Manages local state, auth tokens, and UI rendering. Communicates with the server via REST APIs for CRUD operations and Websockets for live events.
2. **Server Layer:** Contains business logic controllers, specialized background services (Auto-Processing, Plagiarism, Code Execution), and middleware for authentication, logging, and file uploads.
3. **Data Layer:** MongoDB hosts collections for Users, Projects, Assignments, Submissions, PlagiarismReports, and Notifications.

---

## ⚙️ Core Modules & Features

### 1. Authentication & Role-Based Access Control (RBAC)
- Supports three primary roles: `Student`, `Guide` (Faculty), and `Admin`.
- Secures routes using JWT (JSON Web Tokens).
- Dynamic dashboard rendering based on the authenticated user's role.

### 2. Capstone Project Management
- Students can create projects, add team members, and upload **Project Reports** and **Presentations** (PDF format).
- Guides can review, schedule interviews, and grade these submissions via interactive rubrics.
- **Automated AI Plagiarism Check:** When documents are uploaded, the backend automatically scans them (utilizing LLMs/Generative AI via the `scanDocument` utility) to return an `overallSimilarity` score. If it exceeds 35%, a real-time warning is emitted to the student and guide.

### 3. Coding Assignments & Auto-Evaluation
- Faculty can create coding assignments with specific test cases, language restrictions, and a plagiarism threshold.
- Students write or upload code (C, C++, Java, Python, JavaScript, Go, Ruby, Rust).
- The **Auto-Processing Service** runs the submission against hidden test cases and generates a grade instantly.

### 4. Code Execution Engine (`executionService.js`)
- **Docker Sandbox:** Untrusted code is executed inside ephemeral Docker containers (`docker run --rm`).
- **Resource Limits:** Hard limits are enforced for security: Memory (`128MB`), CPU (`0.5 cores`), Processes (`--pids-limit=20`), and Network (`--network=none`).
- **Timeouts:** Code execution is strictly bounded (default 10s).
- **Development Fallback:** If Docker is unavailable on the host system, the engine falls back to direct localized process execution via `child_process.exec()`.

### 5. Advanced Plagiarism Detection Engine (`plagiarismService.js`)
The platform uses the **Winnowing Algorithm** combined with structural normalization to detect code plagiarism, ensuring students cannot cheat simply by renaming variables.

**How it works (The Algorithm):**
1. **Normalization:** Removes comments, standardizes whitespace, and lowercases everything.
2. **Structural AST Normalization:** Replaces numbers with `LITERAL` and variable/function identifiers with `VAR`, while preserving structural keywords (`if`, `for`, `while`). This focuses the scanner on the *logic structural skeleton*.
3. **Tokenization:** Splits the normalized code into discrete meaningful tokens.
4. **K-Grams:** Groups tokens into overlapping windows of size $k$ (e.g., $k=5$).
5. **Rolling Hash:** Hashes each k-gram into a 32-bit integer.
6. **Winnowing:** Passes a sliding window of size $w$ over the hashes and selects the minimum hash in each window to create the document's "Fingerprint". This guarantees that partial matches are found while heavily reducing data density.
7. **Jaccard Similarity Check:** The engine compares fingerprints from two submissions. The final score is a weighted blend: **40% Textual Similarity + 60% Structural Similarity**.
8. **Real-time Alerting:** If the resulting score exceeds the assignment's defined threshold, real-time socket events fire off to alert both the faculty and the involved students.

### 6. Notifications & Real-Time Events
- Handled via `Socket.IO`.
- Whenever a review is scheduled, graded, or flagged for plagiarism, the backend writes a `Notification` document to MongoDB and immediately emits it to the connected user's socket room (joined via their User ID).

---

## 🗄 Database Models

- **User:** Stores credentials, role, and profile data.
- **Project:** Stores capstone project metadata, team members, assigned guide, and a subdocument array of `reviews`.
- **Assignment:** Stores coding assignment configurations (max marks, test cases, time limits).
- **Submission:** Links a student to an assignment, storing the raw code, execution status, marks, and plagiarism score.
- **Notification:** Stores user-specific alerts, tracking read/unread status.
- **DocumentPlagiarismReport & PlagiarismReport:** Stores the results, matching code regions, and metadata from the Winnowing algorithm and document AI scans.

---

## 🎨 UI/UX Philosophy
The frontend recently underwent a significant refactor to adopt an **Enterprise SaaS Aesthetic**. Features like excessive gaming glows and unnecessary playground/leaderboard modules were stripped out in favor of clean cards, muted glass-morphic backgrounds, precise padding, and highly readable typography. 

Transition logic is centralized in CSS variables (`index.css`) and driven by Framer Motion's `AnimatePresence` for fluid layout shifts.
