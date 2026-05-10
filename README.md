# J-Flow AI — AI-Assisted Project Management

> A full-stack project management app for small dev teams with an integrated AI assistant powered by Google Gemini.

![Stack](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-brightgreen)
![Stack](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue)
![Stack](https://img.shields.io/badge/AI-Google%20Gemini-purple)
![Stack](https://img.shields.io/badge/DB-H2%20In--Memory-orange)

---

## Features

- **Kanban Board** — Drag tasks across TODO / IN PROGRESS / DONE
- **AI Java Assistant** — Built-in chat panel powered by Gemini or local demo mode
- **Project Dashboard** — All projects with progress bars
- **Task Management** — Create, edit, label, prioritize, delete tasks
- **Sprint Stats** — Live completion tracking per project
- **Demo Data** — 3 projects + 11 tasks seeded on first run

---

## Backend fixes in this update

The backend chat integration previously had several issues that prevented reliable AI responses:

- Anthropic/Claude property names were still used even though the request payload targeted Gemini.
- A real-looking API key was committed in `application.properties`; the backend now reads `GEMINI_API_KEY` from the environment instead.
- The Gemini system prompt was sent as a normal user chat message; it now uses Gemini's REST `system_instruction` request field.
- Gemini API errors were not checked by HTTP status; non-2xx responses now return the API error message to the chat panel.
- The backend ran on port `8081` while the frontend API client points to `8080`; the backend now defaults to `8080`.
- Demo mode still works without an API key, while setting `GEMINI_API_KEY` automatically enables live Gemini responses.
- CORS allowed origins are now read from `app.cors.allowed-origins` instead of being duplicated in security code.
- The Vite frontend now proxies `/api` to the Spring Boot backend on `8080`, with `VITE_API_BASE_URL` available when you need to point at another backend URL.

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

4. Open **http://localhost:5173** or the Vite terminal URL in your browser ✅

### Option B — VS Code Run Configs

Use the **Run & Debug** panel (Ctrl+Shift+D) and select:
- `🌊 Full Stack (Backend + Frontend)` — starts both at once

> Requires the **Spring Boot Dashboard** extension for Java launch.

---

## AI Assistant Setup

The app works in **demo mode** out of the box with smart pre-written responses. The backend automatically falls back to demo mode when `GEMINI_API_KEY` is not set.

To enable **live Gemini AI**:

1. Get an API key from https://aistudio.google.com/app/apikey
2. Set the environment variables before starting the backend:

**Linux/Mac:**
```bash
cd backend
export GEMINI_API_KEY=your-gemini-api-key
mvn spring-boot:run
```

**Windows (PowerShell):**
```powershell
cd backend
$env:GEMINI_API_KEY="your-gemini-api-key"
mvn spring-boot:run
```

Optional overrides:

```bash
export GEMINI_API_MODEL=gemini-2.5-flash
export GEMINI_DEMO_MODE=true  # force local demo responses even when GEMINI_API_KEY is set
```

Backend defaults are configured in `backend/src/main/resources/application.properties`:

```properties
gemini.api.key=${GEMINI_API_KEY:}
gemini.api.model=${GEMINI_API_MODEL:gemini-2.5-flash}
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/${gemini.api.model}:generateContent
gemini.api.demo-mode=${GEMINI_DEMO_MODE:false}
```

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
│   │       └── AiService.java     # Gemini API integration
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
│   └── vite.config.js             # Dev proxy /api → :8080
│
└── jflow.code-workspace
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
| DELETE | `/api/ai/history/{projectId}` | Clear chat history |

Backend API: http://localhost:8080/api

Frontend API client: uses `/api` by default through the Vite dev proxy. Set `VITE_API_BASE_URL` only when calling a backend on a different origin.

H2 Console: http://localhost:8080/h2-console (JDBC: `jdbc:h2:mem:jflowdb`)

---

## Extending the App

- **Add PostgreSQL**: Replace H2 dependency + update `application.properties`
- **Add Auth**: Tighten `SecurityConfig.java`, add JWT, and protect `/api/**`
- **More AI context**: Edit `AiService.java` to include more project metadata
- **Drag-and-drop**: Install `@dnd-kit/core` and use `DndContext` in `ProjectBoard.jsx`

---

## License

MIT — build something awesome with it! 🚀
