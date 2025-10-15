🎬 MovieSocial — A Social media for Movies

.
Users can register, log in, review movies, create watchlists, and explore reviews by others.

🚀 Tech Stack

Frontend: React, Tailwind CSS, React Router

Backend: Node.js, Express.js

Database: MongoDB Atlas + Mongoose

Authentication: JWT (JSON Web Tokens) + bcryptjs

Movie Data: TMDb API

Utilities: Axios, dotenv, nodemon

📦 Features

🔐 User Authentication: Register, login, JWT-based sessions

🎥 Movie Search: Search movies from TMDb API

📝 Reviews: Post, edit, like, and comment on reviews

⭐ Watchlist & Watched: Keep track of movies you’ve seen or want to see

👤 Profiles: User bios, avatars, and activity

📰 Feed: Latest reviews from all users

⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/yourusername/movie-log.git
cd movie-log

2️⃣ Backend Setup (Server)
cd server
npm init -y
npm install express mongoose cors dotenv jsonwebtoken bcryptjs axios
npm install -D nodemon

Create a .env file in the server/ folder:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
TMDB_API_KEY=your_tmdb_api_key
PORT=5001

Run the backend:

npm run dev

3️⃣ Frontend Setup (Client)
cd ../client
npx create-react-app .
npm install -D tailwindcss@3 postcss@latest autoprefixer@latest
npx tailwindcss init -p
npm install axios react-router-dom jwt-decode

Run the frontend:

npm start

## Deployment

Two recommended deployment approaches are included below. Choose the one that fits your workflow.

Option A — Split hosting (fast, recommended)

- Host the frontend on Vercel or Netlify.
- Host the backend on Render, Heroku, or similar.

Steps (quick):

1. Configure server environment variables on the host (Render/Heroku):
   - MONGO_URI, JWT_SECRET, TMDB_API_KEY, OMDB_API_KEY, PORT (optional), CORS_ORIGIN
2. Deploy server (point Render/Heroku to the repo's root or the `server/` folder).
3. Deploy client to Vercel/Netlify. Set `REACT_APP_API_URL` to your API URL (e.g. `https://api.example.com`).

Option B — Single-container deploy (Docker)

- Build a Docker image (multi-stage Dockerfile included) which builds the client and runs the server.
- Push the image to a container registry (GitHub Container Registry, DockerHub) and deploy to Cloud Run, ECS, or similar.

Steps (quick):

1. Build locally:
   docker build -t ghcr.io/<owner>/<repo>:latest .
2. Run locally:
   docker run -e MONGO_URI="<uri>" -e JWT_SECRET="<secret>" -p 5001:5001 ghcr.io/<owner>/<repo>:latest

CI (GitHub Actions): A sample workflow is added at `.github/workflows/ci-cd.yml` that builds the client, builds the Docker image and pushes it to GHCR when you push to `main`.

Security note: Never commit real secrets to the repository. Use the host's secret store (Render env vars, Vercel environment variables, GitHub Secrets) and rotate credentials if accidentally exposed.

### Free hosting recommended setup (Vercel for client + Railway for server)

This is the easiest, free-friendly option. Vercel provides a very fast static hosting tier for the React client. Railway (or Render free plan) can host your Node server and set environment variables easily.

1. Prepare the repo

   - Push your code to GitHub (if not already).
   - Ensure you have a `server/.env` locally for development (do not commit).

2. Deploy the client (Vercel)

   - Sign in to Vercel and import your GitHub repository.
   - Project root: `client` (select the client folder when configuring).
   - Build Command: `npm ci && npm run build`
   - Output Directory: `build`
   - Add an Environment Variable on Vercel (for preview/production as needed):
     - `REACT_APP_API_URL` -> e.g. `https://your-railway-app.up.railway.app` (set once you have the server URL)
   - Deploy. Vercel will provide a frontend URL like `https://movie-social.vercel.app`.

3. Deploy the server (Railway — free tier)

   - Sign in to Railway and create a new project → Deploy from GitHub.
   - Select the repo and choose the `server` folder as the deployment root.
   - Railway will detect Node and install dependencies.
   - In Railway project settings → Variables, add these environment variables:
     - `MONGO_URI` (Atlas connection string)
     - `JWT_SECRET`
     - `TMDB_API_KEY`
     - `OMDB_API_KEY` (optional)
     - `CORS_ORIGIN` => set to your Vercel URL (e.g. `https://movie-social.vercel.app`) or `*` for testing.
   - Deploy the server. Railway will provide a URL like `https://<project>.up.railway.app`.

4. Connect them
   - After the server is deployed, set `REACT_APP_API_URL` on Vercel to your Railway server URL.
   - Re-deploy client on Vercel (or trigger a redeploy). The client will now talk to the server.

Notes and tips - Railway free tier provides a generous starter plan; ensure your MongoDB Atlas has an IP allowlist or set to allow access from Railway (Atlas may allow access from anywhere if you set it so, but it's safer to configure connection security). - If you prefer Heroku, Render, or Fly, deployment steps are very similar: set env vars and point the deploy root to `server`.

If you'd like, I can create a step-by-step GitHub Actions workflow to automatically set the Vercel environment variable after the server deploys, but that requires provider-specific API tokens.

🔑 API Routes (Server)

POST /api/auth/register → Register user

POST /api/auth/login → Login user

GET /api/movies/search?query= → Search movies (TMDb proxy)

GET /api/reviews/feed → Get global reviews

🙌 Acknowledgements

TMDb
for movie data

Open-source MERN stack community 🚀
