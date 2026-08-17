# How to Run InsureIQ

This guide provides instructions on how to start the InsureIQ software. The easiest and recommended way to run the application for all users is by using Docker, which sets up the database, backend, frontend, and caching layers automatically.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git (to clone the repository)

## Running with Docker (Recommended for All Users)

Follow these steps to run the complete software stack:

### 1. Set Up Environment Variables

First, you need to set up the environment variables. A template is provided in the `.env.example` file. 

Copy the example file to create your local `.env` file:
```bash
cp .env.example .env
```
*(Optional)* You can open the `.env` file and modify the values if needed, but the defaults should work out of the box for a local development environment.

### 2. Start the Application

Build and start the application containers using Docker Compose. Open your terminal in the root directory of the project (where the `docker-compose.yml` file is located) and run:

```bash
docker-compose up --build
```
*(If you are using a newer version of Docker Compose, the command is `docker compose up --build`)*

This command will:
- Download the necessary base images (PostgreSQL, Redis).
- Build the Backend (FastAPI) Docker image.
- Build the Frontend (Vite/React) Docker image.
- Start all services and link them together.

### 3. Access the Application

Once the containers are successfully running, you can access the different parts of the software in your web browser:

- **Frontend Application (Web Interface):** 
  👉 [http://localhost:15173](http://localhost:15173)
  
- **Backend API Server:** 
  👉 [http://localhost:18000](http://localhost:18000)

- **API Documentation (Swagger UI):** 
  👉 [http://localhost:18000/docs](http://localhost:18000/docs)

### Stopping the Application

To stop the running application, go to the terminal where Docker Compose is running and press `Ctrl + C`. 

If you want to stop the containers and remove them completely, run:
```bash
docker-compose down
```
*(To also remove the database and redis volumes, append the `-v` flag: `docker-compose down -v`)*

---

## Troubleshooting

- **Port Conflicts:** If you get an error that a port is already allocated (e.g., `port 15432 is already in use`), make sure you don't have a local instance of PostgreSQL, Redis, or another application running on those ports.
- **Empty Screen on Frontend:** Make sure the backend is fully initialized. The frontend might start faster than the database and backend. Refresh the page after a few seconds.

---
---

# Part Two — Detailed Expansion

This section provides an in-depth, step-by-step expansion of every topic covered in Part One. It is intended for users who are new to Docker, need OS-specific guidance, or want to understand the full architecture and every configuration option available in InsureIQ.

---

## Table of Contents (Part Two)

1. [System Requirements](#1-system-requirements)
2. [Installing Docker & Docker Compose](#2-installing-docker--docker-compose)
3. [Cloning the Repository](#3-cloning-the-repository)
4. [Understanding the Project Architecture](#4-understanding-the-project-architecture)
5. [Environment Variables — In Detail](#5-environment-variables--in-detail)
6. [Docker Compose — In Detail](#6-docker-compose--in-detail)
7. [Building & Starting Containers — Step by Step](#7-building--starting-containers--step-by-step)
8. [What Happens on First Launch (Startup Sequence)](#8-what-happens-on-first-launch-startup-sequence)
9. [Accessing & Verifying the Running Application](#9-accessing--verifying-the-running-application)
10. [Running Without Docker (Manual Setup)](#10-running-without-docker-manual-setup)
11. [Common Docker Commands & Operations](#11-common-docker-commands--operations)
12. [Advanced Troubleshooting](#12-advanced-troubleshooting)

---

## 1. System Requirements

| Requirement          | Minimum                     | Recommended                   |
|----------------------|-----------------------------|-------------------------------|
| **Operating System** | Linux, macOS 12+, Windows 10+ (with WSL2) | Ubuntu 22.04 LTS / macOS 14+ |
| **RAM**              | 4 GB                        | 8 GB or more                  |
| **Disk Space**       | 5 GB free (for images + data) | 10 GB+                       |
| **CPU**              | 2 cores                     | 4 cores                       |
| **Docker Engine**    | v24.0+                      | v27.0+ (latest stable)        |
| **Docker Compose**   | v2.20+ (integrated plugin)  | v2.29+ (latest stable)        |
| **Git**              | v2.30+                      | Latest                        |
| **Internet**         | Required (first build only) | Broadband                     |

---

## 2. Installing Docker & Docker Compose

### 2.1 Ubuntu / Debian Linux

**Step 1 — Remove any old/unofficial Docker packages:**
```bash
sudo apt-get remove docker docker-engine docker.io containerd runc 2>/dev/null
```

**Step 2 — Update package index and install prerequisites:**
```bash
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

**Step 3 — Add Docker's official GPG key:**
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

**Step 4 — Add the Docker repository:**
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```
> **Note:** If you are on **Debian** instead of Ubuntu, replace `ubuntu` with `debian` in the URL above.

**Step 5 — Install Docker Engine, CLI, and Compose plugin:**
```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
This installs:
- `docker-ce` — Docker Engine (daemon) **v27.x**
- `docker-ce-cli` — Docker CLI tool
- `containerd.io` — Container runtime
- `docker-buildx-plugin` — Extended build capabilities
- `docker-compose-plugin` — Docker Compose **v2.29+** (the `docker compose` command)

**Step 6 — (Optional but recommended) Add your user to the `docker` group:**

By default, Docker requires `sudo`. To run Docker commands without `sudo`:
```bash
sudo usermod -aG docker $USER
```
**You must log out and log back in** (or reboot) for this to take effect.

**Step 7 — Verify the installation:**
```bash
docker --version
# Expected output: Docker version 27.x.x, build xxxxxxx

docker compose version
# Expected output: Docker Compose version v2.29.x
```

### 2.2 Fedora / RHEL / CentOS

**Step 1 — Install the `dnf-plugins-core` package:**
```bash
sudo dnf -y install dnf-plugins-core
```

**Step 2 — Add the Docker repository:**
```bash
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
```

**Step 3 — Install Docker Engine and Compose:**
```bash
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**Step 4 — Start and enable the Docker service:**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

**Step 5 — (Optional) Add your user to the `docker` group:**
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

**Step 6 — Verify:**
```bash
docker --version
docker compose version
```

### 2.3 macOS

**Step 1 — Download Docker Desktop for Mac:**

Go to [https://docs.docker.com/desktop/install/mac-install/](https://docs.docker.com/desktop/install/mac-install/) and download the installer appropriate for your chip:
- **Apple Silicon (M1/M2/M3/M4):** `Docker Desktop for Mac with Apple Silicon`
- **Intel:** `Docker Desktop for Mac with Intel chip`

**Step 2 — Install:**
- Open the downloaded `.dmg` file.
- Drag `Docker.app` into your `Applications` folder.
- Launch Docker from your Applications.

**Step 3 — Verify from the terminal:**
```bash
docker --version
# Expected: Docker version 27.x.x

docker compose version
# Expected: Docker Compose version v2.29.x
```

> Docker Desktop for Mac bundles Docker Engine, Docker CLI, Docker Compose, and Docker Buildx — all in one installer. No additional installation is needed.

### 2.4 Windows (via WSL2)

**Step 1 — Enable WSL2:**

Open **PowerShell as Administrator** and run:
```powershell
wsl --install
```
Restart your computer when prompted.

**Step 2 — Download Docker Desktop for Windows:**

Go to [https://docs.docker.com/desktop/install/windows-install/](https://docs.docker.com/desktop/install/windows-install/) and download the installer.

**Step 3 — Install:**
- Run the installer.
- Ensure **"Use WSL 2 instead of Hyper-V"** is checked during installation.
- Follow the prompts and restart if asked.

**Step 4 — Verify from a WSL terminal or PowerShell:**
```bash
docker --version
docker compose version
```

### 2.5 Installing Git

If you don't have Git installed:

| OS | Command |
|---|---|
| **Ubuntu/Debian** | `sudo apt-get install -y git` |
| **Fedora** | `sudo dnf install -y git` |
| **macOS** | `xcode-select --install` (or `brew install git`) |
| **Windows** | Download from [https://git-scm.com/download/win](https://git-scm.com/download/win) |

Verify:
```bash
git --version
# Expected: git version 2.30+ or newer
```

---

## 3. Cloning the Repository

**Step 1 — Open your terminal** and navigate to the directory where you want to store the project:
```bash
cd ~/Projects    # or any directory of your choice
```

**Step 2 — Clone the repository:**
```bash
git clone <repository-url> Insure-IQ
```
> Replace `<repository-url>` with the actual Git URL of the InsureIQ project (e.g., `https://github.com/your-org/Insure-IQ.git`).

**Step 3 — Navigate into the project:**
```bash
cd Insure-IQ
```

**Step 4 — Confirm the project structure:**
```bash
ls -la
```
You should see at minimum:
```
.env.example
docker-compose.yml
backend/
frontend/
README.md
HOW_TO_RUN.md
```

---

## 4. Understanding the Project Architecture

InsureIQ is a full-stack, multi-container application. Docker Compose orchestrates **four services** that work together:

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │   Frontend    │    │   Backend    │                   │
│  │ (React/Vite)  │───▶│  (FastAPI)   │                   │
│  │  Port: 15173   │    │  Port: 18000  │                   │
│  └──────────────┘    └──────┬───────┘                   │
│                             │                           │
│                     ┌───────┴───────┐                   │
│                     │               │                   │
│              ┌──────▼─────┐  ┌──────▼─────┐             │
│              │  PostgreSQL │  │   Redis    │             │
│              │  (pgvector) │  │  (Cache)   │             │
│              │  Port: 15432 │  │  Port: 16379│             │
│              └────────────┘  └────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Service Details

| Service | Container Name | Base Image | Port | Purpose |
|---|---|---|---|---|
| **db** | `insureiq-db` | `pgvector/pgvector:pg16` | `5432` | PostgreSQL 16 database with pgvector extension for AI/vector operations |
| **redis** | `insureiq-redis` | `redis:7-alpine` | `16379` | In-memory cache and message broker |
| **backend** | `insureiq-backend` | `python:3.11-slim` (custom build) | `8000` | FastAPI REST API server with Uvicorn |
| **frontend** | `insureiq-frontend` | `node:20-alpine` (custom build) | `5173` | React 19 + Vite 8 development server |

### Startup Order (Dependency Chain)
```
db  ──┐
      ├──▶  backend  ──▶  frontend
redis ┘
```
The backend waits for `db` and `redis` to be available before starting. The frontend waits for the backend.

### Backend Technology Stack
- **Python 3.11** with **FastAPI ≥0.111**
- **SQLAlchemy 2.0** (async) with **asyncpg** driver
- **Alembic** for database migrations
- **Pydantic v2** for data validation
- **passlib + python-jose** for authentication (JWT/bcrypt)
- **Uvicorn** as the ASGI server

### Frontend Technology Stack
- **React 19** with **TypeScript 6**
- **Vite 8** as the build tool / dev server
- **TailwindCSS 4** for styling
- **React Router v7** for routing
- **TanStack React Query v5** for server-state management
- **Zustand** for client-state management
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Axios** for HTTP requests
- **React Hook Form + Zod** for form handling and validation

---

## 5. Environment Variables — In Detail

The `.env` file at the project root is used by **all four services** via Docker Compose. Below is a detailed explanation of every variable:

### Database Variables
| Variable | Default Value | Description |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Username for the PostgreSQL database. The `db` container uses this to create the initial superuser. |
| `POSTGRES_PASSWORD` | `postgres` | Password for the PostgreSQL user. **Change this in production.** |
| `POSTGRES_DB` | `insureiq` | Name of the database that will be automatically created on first container startup. |
| `POSTGRES_HOST` | `db` | Hostname of the PostgreSQL server. Inside Docker, this must be `db` (the service name in `docker-compose.yml`). For local (non-Docker) development, use `localhost`. |
| `POSTGRES_PORT` | `5432` | Port that PostgreSQL listens on inside the container. |

### Redis Variables
| Variable | Default Value | Description |
|---|---|---|
| `REDIS_HOST` | `redis` | Hostname of the Redis server. Inside Docker, this must be `redis` (the service name). For local development, use `localhost`. |
| `REDIS_PORT` | `16379` | Port that Redis listens on. |

### Backend Variables
| Variable | Default Value | Description |
|---|---|---|
| `SECRET_KEY` | `dev_secret_key_change_in_production` | Secret key used for signing JWT tokens and other cryptographic operations. **Must be changed to a strong random string in production.** |
| `ENVIRONMENT` | `development` | Application environment mode. Controls logging verbosity and SQLAlchemy echo. Use `development` or `production`. |
| `CORS_ORIGINS` | `http://localhost:15173` | Comma-separated list of allowed origins for Cross-Origin Resource Sharing. The frontend URL must be listed here. |

### Frontend Variables
| Variable | Default Value | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:18000` | The base URL of the backend API. Vite requires environment variables to start with `VITE_` to be exposed to the browser. |

### Generating a Strong Secret Key

For production, generate a cryptographically secure secret key:
```bash
# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Using OpenSSL
openssl rand -base64 64
```

### Complete `.env` Example for Local Development
```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=insureiq
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# FastAPI Backend
SECRET_KEY=dev_secret_key_change_in_production
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:15173

# Vite Frontend (must start with VITE_)
VITE_API_URL=http://localhost:18000
```

---

## 6. Docker Compose — In Detail

The `docker-compose.yml` file defines the entire application stack. Here is what each section does:

### 6.1 The `db` Service (PostgreSQL + pgvector)
```yaml
db:
  image: pgvector/pgvector:pg16
  container_name: insureiq-db
  restart: always
  env_file:
    - .env
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-postgres}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    POSTGRES_DB: ${POSTGRES_DB:-insureiq}
  ports:
    - "15432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
```
- **`image: pgvector/pgvector:pg16`** — Uses PostgreSQL 16 with the pgvector extension pre-installed (needed for AI/vector similarity operations).
- **`restart: always`** — Automatically restarts the container if it crashes or the host reboots.
- **`env_file: .env`** — Loads variables from the root `.env` file.
- **`environment`** — Sets database credentials. The `${VAR:-default}` syntax provides fallback defaults.
- **`ports: "15432:5432"`** — Maps the container's port 5432 to the host's port 5432, allowing direct database access from your machine.
- **`volumes: postgres_data`** — Persists database data in a named Docker volume so data survives container restarts.

### 6.2 The `redis` Service
```yaml
redis:
  image: redis:7-alpine
  container_name: insureiq-redis
  restart: always
  ports:
    - "16379:6379"
  volumes:
    - redis_data:/data
```
- **`image: redis:7-alpine`** — Uses Redis 7 on Alpine Linux (lightweight, ~5 MB).
- **`volumes: redis_data`** — Persists cached data across restarts.

### 6.3 The `backend` Service (FastAPI)
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: insureiq-backend
  restart: always
  env_file:
    - .env
  ports:
    - "18000:8000"
  volumes:
    - ./backend:/app
  depends_on:
    - db
    - redis
```
- **`build: context: ./backend`** — Builds a custom Docker image from `backend/Dockerfile` using Python 3.11-slim.
- **`volumes: ./backend:/app`** — Mounts the local `backend/` directory into the container at `/app`. This enables **live code reloading** — changes you make to backend files are immediately reflected without rebuilding.
- **`depends_on`** — Ensures the `db` and `redis` containers start **before** the backend container.

### 6.4 The `frontend` Service (React/Vite)
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: insureiq-frontend
  restart: always
  env_file:
    - .env
  ports:
    - "15173:5173"
  volumes:
    - ./frontend:/app
    - /app/node_modules
  depends_on:
    - backend
```
- **`volumes: ./frontend:/app`** — Mounts the local `frontend/` directory for live reloading.
- **`/app/node_modules`** — This anonymous volume prevents the host's `node_modules` from overriding the container's installed dependencies. This is critical on machines where the host OS differs from the container OS (e.g., macOS host → Linux container).
- **`depends_on: backend`** — Ensures the backend starts before the frontend.

### 6.5 Named Volumes
```yaml
volumes:
  postgres_data:
  redis_data:
```
These are Docker-managed persistent storage volumes. Data stored here survives `docker compose down` but is removed with `docker compose down -v`.

---

## 7. Building & Starting Containers — Step by Step

### 7.1 First-Time Build

From the project root directory (where `docker-compose.yml` is located):

```bash
docker compose up --build
```

What this does, in order:
1. **Pulls base images** from Docker Hub:
   - `pgvector/pgvector:pg16` (~400 MB)
   - `redis:7-alpine` (~30 MB)
   - `python:3.11-slim` (~150 MB)
   - `node:20-alpine` (~180 MB)
2. **Builds the backend image:**
   - Installs `gcc` and `libpq-dev` system libraries
   - Installs Python dependencies from `requirements.txt`
   - Copies application code
3. **Builds the frontend image:**
   - Copies `package.json` and `package-lock.json`
   - Runs `npm install` to install all Node.js dependencies
   - Copies application code
4. **Starts all four containers** in dependency order: `db` → `redis` → `backend` → `frontend`

> **First build time:** 3–10 minutes depending on your internet speed and machine. Subsequent builds are much faster due to Docker layer caching.

### 7.2 Running in the Background (Detached Mode)

To start containers in the background so you get your terminal back:
```bash
docker compose up --build -d
```
The `-d` (detached) flag runs the containers in the background.

To view logs while running in detached mode:
```bash
# All services
docker compose logs -f

# Only backend logs
docker compose logs -f backend

# Only frontend logs
docker compose logs -f frontend

# Only database logs
docker compose logs -f db
```

### 7.3 Rebuilding After Code Changes

- **Backend or frontend code changes (inside `backend/` or `frontend/`):** No rebuild needed. The volume mounts provide live reloading. Both Uvicorn and Vite watch for file changes.
- **Changes to `requirements.txt` or `package.json`** (new dependencies added): You must rebuild:
  ```bash
  docker compose up --build
  ```
- **Changes to `Dockerfile` or `docker-compose.yml`:** You must rebuild:
  ```bash
  docker compose up --build
  ```

### 7.4 Stopping and Cleaning Up

```bash
# Stop all containers (preserves data)
docker compose down

# Stop all containers AND delete database/redis data
docker compose down -v

# Stop and remove everything including built images
docker compose down -v --rmi all

# Remove all unused Docker resources system-wide (use with caution)
docker system prune -a
```

---

## 8. What Happens on First Launch (Startup Sequence)

When the backend container starts for the first time, it executes the `start.sh` script, which performs three steps in order:

### Step 1 — Alembic Database Migrations
```bash
alembic upgrade head
```
This applies all pending database migrations to the PostgreSQL database, creating the complete schema (tables, indexes, constraints). Alembic reads its configuration from `backend/alembic.ini` and applies migration scripts stored in `backend/alembic/versions/`.

### Step 2 — Database Seeding
```bash
python scripts/seed.py
```
This runs the seeding script that populates the database with initial data such as:
- Default admin user(s)
- Sample tenants
- Demo insurance providers and plans
- Reference data

### Step 3 — Start the API Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 18000 --reload
```
This starts the FastAPI application using Uvicorn as the ASGI server:
- `--host 0.0.0.0` — Listens on all network interfaces (required inside Docker)
- `--port 18000` — Serves on port 8000
- `--reload` — Watches for file changes and auto-restarts (development mode)

---

## 9. Accessing & Verifying the Running Application

### 9.1 Check Container Status

```bash
docker compose ps
```
Expected output:
```
NAME                 IMAGE                      STATUS          PORTS
insureiq-backend     insure-iq-backend          Up              0.0.0.0:18000->8000/tcp
insureiq-db          pgvector/pgvector:pg16     Up              0.0.0.0:15432->5432/tcp
insureiq-frontend    insure-iq-frontend         Up              0.0.0.0:15173->5173/tcp
insureiq-redis       redis:7-alpine             Up              0.0.0.0:16379->6379/tcp
```
All four containers should show `Up` status.

### 9.2 Verify the Backend Health

```bash
curl http://localhost:18000/health
```
Expected response:
```json
{
  "status": "success",
  "data": {
    "status": "healthy"
  }
}
```

### 9.3 Access Points

| What | URL | Description |
|---|---|---|
| **Frontend (Web UI)** | [http://localhost:15173](http://localhost:15173) | The React web application |
| **Backend API** | [http://localhost:18000](http://localhost:18000) | FastAPI root endpoint |
| **Swagger API Docs** | [http://localhost:18000/docs](http://localhost:18000/docs) | Interactive API documentation (Swagger UI) |
| **ReDoc API Docs** | [http://localhost:18000/redoc](http://localhost:18000/redoc) | Alternative API documentation (ReDoc) |
| **Health Check** | [http://localhost:18000/health](http://localhost:18000/health) | Server health endpoint |

### 9.4 API Route Modules

The backend exposes the following API route groups, all under the `/api/v1` prefix:

| Module | Endpoint Prefix | Purpose |
|---|---|---|
| Auth | `/api/v1/auth/...` | User registration, login, JWT token management |
| Tenants | `/api/v1/tenants/...` | Multi-tenant (insurance provider) management |
| Applications | `/api/v1/applications/...` | Insurance application CRUD |
| Underwriting | `/api/v1/underwriting/...` | AI-powered underwriting decisions |
| Policies | `/api/v1/policies/...` | Policy management |
| Claims | `/api/v1/claims/...` | Claims filing and processing |
| Agent | `/api/v1/agent/...` | Insurance agent operations |
| Admin | `/api/v1/admin/...` | Administrative operations |
| Console | `/api/v1/console/...` | Provider console operations |
| ML | `/api/v1/ml/...` | Machine learning model endpoints |
| Marketplace | `/api/v1/marketplace/...` | B2C insurance marketplace |

---

## 10. Running Without Docker (Manual Setup)

If you prefer to run the services directly on your machine without Docker, follow these steps.

### 10.1 Prerequisites for Manual Setup

| Software | Required Version | Installation |
|---|---|---|
| Python | 3.11+ | [https://python.org/downloads](https://python.org/downloads) |
| Node.js | 20+ | [https://nodejs.org](https://nodejs.org) |
| PostgreSQL | 16+ | [https://postgresql.org/download](https://postgresql.org/download) |
| Redis | 7+ | [https://redis.io/download](https://redis.io/download) |

You must also install the **pgvector** extension for PostgreSQL:
```bash
# Ubuntu/Debian
sudo apt-get install -y postgresql-16-pgvector

# macOS (Homebrew)
brew install pgvector
```

### 10.2 Set Up the Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create the database and enable pgvector
CREATE DATABASE insureiq;
\c insureiq
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 10.3 Start Redis

```bash
redis-server
```
Or if installed via system package manager:
```bash
sudo systemctl start redis
```

### 10.4 Set Up & Run the Backend

```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment
python3.11 -m venv venv

# Activate the virtual environment
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Install Python dependencies
pip install -r requirements.txt

# Configure the backend .env file
# Edit backend/.env and ensure:
#   POSTGRES_HOST=localhost   (not "db")
#   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:15432/insureiq
```

Create or update `backend/.env` to point to your local services:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:15432/insureiq
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=insureiq
SECRET_KEY=supersecretkey12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

Run the database migrations and seed data:
```bash
alembic upgrade head
python scripts/seed.py
```

Start the backend server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 18000 --reload
```

### 10.5 Set Up & Run the Frontend

Open a **new terminal** window:
```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will start on [http://localhost:15173](http://localhost:15173).

> **Important:** When running locally without Docker, make sure the `VITE_API_URL` in the root `.env` file (or your shell environment) is set to `http://localhost:18000`.

---

## 11. Common Docker Commands & Operations

### Container Management
```bash
# List running containers
docker compose ps

# View real-time logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Restart a single service without affecting others
docker compose restart backend

# Stop all services
docker compose stop

# Start previously stopped services (without rebuilding)
docker compose start

# Rebuild and restart only the backend
docker compose up --build -d backend
```

### Executing Commands Inside Containers
```bash
# Open a bash shell inside the backend container
docker compose exec backend bash

# Run a one-off Python command inside the backend
docker compose exec backend python -c "print('Hello from inside the container')"

# Run Alembic migrations manually
docker compose exec backend alembic upgrade head

# Re-seed the database
docker compose exec backend python scripts/seed.py

# Open a PostgreSQL interactive shell
docker compose exec db psql -U postgres -d insureiq

# Open a Redis CLI
docker compose exec redis redis-cli
```

### Inspecting Resources
```bash
# List Docker volumes
docker volume ls

# Inspect the PostgreSQL data volume
docker volume inspect insure-iq_postgres_data

# List all Docker images
docker images

# Check disk usage by Docker
docker system df
```

---

## 12. Advanced Troubleshooting

### 12.1 Port Already in Use

**Symptom:** Error message like `Bind for 0.0.0.0:15432 failed: port is already allocated`.

**Solution:** Find and stop the process using the port:
```bash
# Find what is using port 5432
sudo lsof -i :15432
# or
sudo ss -tlnp | grep 15432

# Kill the process (replace <PID> with the actual process ID)
sudo kill <PID>

# Or stop the local PostgreSQL service
sudo systemctl stop postgresql
```

Repeat for ports `16379` (Redis), `18000` (Backend), or `15173` (Frontend) as needed.

### 12.2 Database Connection Refused

**Symptom:** Backend logs show `ConnectionRefusedError` or `Connection to database failed`.

**Causes & Fixes:**
1. The `db` container hasn't finished initializing yet. Wait 10–15 seconds and check again.
2. Verify the `db` container is running: `docker compose ps db`
3. Check database logs: `docker compose logs db`
4. Ensure `POSTGRES_HOST=db` in the `.env` file (not `localhost` — that won't work inside Docker).

### 12.3 Frontend Shows Blank Page or Network Errors

**Symptom:** The web UI loads a white/blank page or shows API errors in the browser console.

**Fixes:**
1. Open browser developer tools (F12) → Console tab. Look for errors.
2. Ensure the backend is healthy: `curl http://localhost:18000/health`
3. Verify `VITE_API_URL=http://localhost:18000` is in the `.env` file.
4. If you changed `VITE_API_URL`, you must rebuild the frontend: `docker compose up --build frontend`

### 12.4 Permission Denied Errors on Linux

**Symptom:** `Got permission denied while trying to connect to the Docker daemon socket`

**Fix:**
```bash
sudo usermod -aG docker $USER
# Then log out and log back in, or run:
newgrp docker
```

### 12.5 Out of Disk Space

**Symptom:** Build fails with "no space left on device".

**Fix:**
```bash
# Remove all stopped containers, unused networks, dangling images, and build cache
docker system prune -a

# Also remove unused volumes (WARNING: this deletes database data!)
docker volume prune
```

### 12.6 Resetting Everything from Scratch

If you want a completely clean start (deletes all data):
```bash
# Stop everything, remove containers, volumes, and images
docker compose down -v --rmi all

# Remove any leftover Docker resources
docker system prune -a --volumes

# Rebuild from scratch
docker compose up --build
```

### 12.7 WSL2-Specific Issues (Windows)

- **Slow file performance:** Ensure your project files are stored inside the WSL filesystem (e.g., `~/Projects/`), not on the Windows mount (`/mnt/c/`).
- **Docker not starting:** Ensure Docker Desktop is running and WSL integration is enabled in Docker Desktop → Settings → Resources → WSL Integration.

---

> **Need more help?** Check the main [README.md](README.md) for full project documentation, feature details, and API specifications.
