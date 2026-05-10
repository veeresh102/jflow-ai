# J-Flow AI — AI-Assisted Project Management

> A full-stack project management app for small dev teams with an integrated AI assistant powered by Claude.

![Stack](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-brightgreen)
![Stack](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue)
![Stack](https://img.shields.io/badge/AI-Anthropic%20Claude-purple)
![Stack](https://img.shields.io/badge/DB-H2%20In--Memory-orange)

---

## Features

- **Kanban Board** — Drag tasks across TODO / IN PROGRESS / DONE
- **AI Java Assistant** — Built-in chat panel powered by Claude (or demo mode)
- **Project Dashboard** — All projects with progress bars
- **Task Management** — Create, edit, label, prioritize, delete tasks
- **Sprint Stats** — Live completion tracking per project
- **Demo Data** — 3 projects + 11 tasks seeded on first run

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 17+ | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| Node.js | 18+ | https://nodejs.org |
| VS Code | Latest | https://code.visualstudio.com |

---

## Quick Start

### Option A — VS Code (Recommended)

1. Open VS Code → **File → Open Workspace from File** → select `jflow.code-workspace`
2. Install recommended extensions when prompted (Java Pack + Spring Boot + Tailwind)
3. Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

4. Open **http://localhost:5173** in your browser ✅

### Option B — VS Code Run Configs

Use the **Run & Debug** panel (Ctrl+Shift+D) and select:
- `🌊 Full Stack (Backend + Frontend)` — starts both at once

> Requires the **Spring Boot Dashboard** extension for Java launch.

---

## AI Assistant Setup

The app works in **demo mode** out of the box (smart pre-written responses).

To enable **real Claude AI**:

1. Get an API key from https://console.anthropic.com
2. Set the environment variable before starting the backend:

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
mvn spring-boot:run
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"
mvn spring-boot:run
```

**VS Code launch.json** — edit `.vscode/launch.json` and replace `"your-api-key-here"`.

---

## Project Structure

```
jflow-ai/
├── backend/                    # Spring Boot 3.2 (Java 17)
│   ├── src/main/java/com/jflow/
│   │   ├── JFlowApplication.java
│   │   ├── config/
│   │   │   ├── DataSeeder.java      # Demo data on startup
│   │   │   └── SecurityConfig.java
│   │   ├── controller/
│   │   │   ├── ProjectController.java
│   │   │   ├── TaskController.java
│   │   │   └── AiController.java
│   │   ├── model/
│   │   │   ├── Project.java
│   │   │   ├── Task.java
│   │   │   └── AiMessage.java
│   │   ├── repository/           # Spring Data JPA
│   │   └── service/
│   │       ├── ProjectService.java
│   │       ├── TaskService.java
│   │       └── AiService.java     # Anthropic API integration
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/                   # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx          # Sidebar + topbar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Project grid
│   │   │   └── ProjectBoard.jsx    # Kanban + AI panel
│   │   └── utils/
│   │       └── api.js              # Axios API client
│   └── vite.config.js             # Proxy /api → :8080
│
└── .vscode/
    ├── launch.json                 # Run configs
    ├── settings.json
    └── extensions.json
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/{id}/stats` | Task stats |
| GET | `/api/projects/{id}/tasks` | List tasks |
| POST | `/api/projects/{id}/tasks` | Create task |
| PATCH | `/api/tasks/{id}/status` | Move task |
| PUT | `/api/tasks/{id}` | Update task |
| POST | `/api/ai/chat/{projectId}` | AI chat |
| GET | `/api/ai/history/{projectId}` | Chat history |

H2 Console: http://localhost:8080/h2-console (JDBC: `jdbc:h2:mem:jflowdb`)

---

## Extending the App

- **Add PostgreSQL**: Replace H2 dependency + update `application.properties`
- **Add Auth**: Uncomment security in `SecurityConfig.java`, add JWT
- **More AI context**: Edit `AiService.java` to include more project metadata
- **Drag-and-drop**: Install `@dnd-kit/core` and use `DndContext` in `ProjectBoard.jsx`

---

## License

MIT — build something awesome with it! 🚀
