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

🗂️ Project Structure
movie-log/
├── client/ # React frontend
│ ├── src/
│ │ ├── api/ # Axios API calls
│ │ ├── components/ # UI components
│ │ ├── context/ # Auth context provider
│ │ ├── pages/ # App pages
│ │ └── App.js
│ └── tailwind.config.js
└── server/ # Node.js backend
├── models/ # Mongoose schemas
├── routes/ # Express routes
└── index.js # Server entry

🔑 API Routes (Server)

POST /api/auth/register → Register user

POST /api/auth/login → Login user

GET /api/movies/search?query= → Search movies (TMDb proxy)

GET /api/reviews/feed → Get global reviews

🙌 Acknowledgements

TMDb
for movie data

Open-source MERN stack community 🚀
