# Deploying Govi-Isuru to Railway

Yes, it is definitely possible to host the Frontend, Backend, and AI Services on Railway. Since you have a monorepo (all code in one repository), you can deploy three separate services from the same GitHub repository.

## Prerequisites
1. Push your latest code to GitHub (you already did this!).
2. Create a [Railway](https://railway.app/) account.
3. Install the Railway CLI (optional, but helpful) or use the Web Dashboard.

## Step-by-Step Deployment Guide

### 1. Database (MongoDB)
*Since your app uses MongoDB, you need a database first.*
1. In your Railway project, click **New** -> **Database** -> **MongoDB**.
2. Once created, go to the **Variables** tab of the MongoDB service.
3. Copy the `MONGO_URL`. You will need this for the Backend.

### 2. Backend Service (Node.js)
1. Click **New** -> **GitHub Repo** -> Select `Govi-Isuru`.
2. Click **Add Variables** (or Configure) before deploying, or go to **Settings** later.
3. **Settings**:
   - **Root Directory**: `server`
   - **Watch Patterns**: `server/**` (optional, makes it only redeploy when server files change)
4. **Variables**:
   - `MONGO_URI`: (Paste the `MONGO_URL` from Step 1)
   - `JWT_SECRET`: (Set a strong secret, e.g., `my_super_secret_key`)
   - `PORT`: `5000` (Railway usually provides `PORT` automatically, but setting your code to listen on `process.env.PORT` handles this).
   - `AI_SERVICE_URL`: (Leave empty for now, we will add this after deploying the AI service)
5. **Deploy**. Railway will detect the `Dockerfile` in `server/` and build it.
6. Once deployed, go to **Settings** -> **Networking** and generate a **Public Domain** (e.g., `govi-backend.up.railway.app`).

### 3. AI Service (Python)
1. Click **New** -> **GitHub Repo** -> Select `Govi-Isuru` (again).
2. **Settings**:
   - **Root Directory**: `ai-service`
   - **Watch Patterns**: `ai-service/**`
3. **Variables**:
   - No special variables needed unless your python scripts refer to some.
4. **Deploy**. Railway will detect the `Dockerfile` in `ai-service/`.
5. Once deployed, go to **Networking** and generate a **Public Domain** (e.g., `govi-ai.up.railway.app`).
6. **Update Backend**: Go back to your **Backend Service** -> **Variables**.
   - Add/Update `AI_SERVICE_URL`: `https://govi-ai.up.railway.app`
   - Redeploy the Backend.

### 4. Frontend Service (React)
1. Click **New** -> **GitHub Repo** -> Select `Govi-Isuru` (again).
2. **Settings**:
   - **Root Directory**: `client`
   - **Watch Patterns**: `client/**`
3. **Variables**:
   - `REACT_APP_API_URL`: Paste your **Backend Public Domain** (e.g., `https://govi-backend.up.railway.app`).
     - **Important**: Do not add a trailing slash.
     - **Important**: This variable must be present *during the build*.
4. **Deploy**. Railway will detect the `Dockerfile` in `client/` and build the React app.
5. Once deployed, go to **Networking** and generate a **Public Domain** (e.g., `govi-isuru.up.railway.app`).

## Summary of Services
- **Mongo**: Database
- **Backend**: Connects to Mongo and AI Service. Exposes API at `https://govi-backend...`
- **AI Service**: Runs Python models. Exposes API at `https://govi-ai...`
- **Frontend**: Connects to Backend API `https://govi-backend...`. Served via Nginx.

## Troubleshooting
- **CORS Issues**: If the frontend says "Network Error" or CORS failure, you might need to check the Backend `index.js` `cors()` configuration. Currently, `app.use(cors())` allows all origins, so it should work fine.
- **Build Fails**: Check the "Build Logs" in Railway.
- **Health Checks**: If services crash, check "Deploy Logs". Ensure MongoDB is reachable.

**Note on `docker-compose.yml`**:
You don't need to use `docker-compose` on Railway. You are deploying individual services that talk to each other over the public internet (via the domains you generated).
