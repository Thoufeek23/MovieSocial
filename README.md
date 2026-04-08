# MovieSocial

## What it is
MovieSocial is a dedicated social media platform designed for film enthusiasts. It serves as a central hub where users can discover films, track their viewing history, and interact with a community of movie lovers. Users can register for accounts, search for movies using real-world data, write and publish reviews, interact with others' reviews (via likes and comments), and curate personalized watchlists and "already watched" lists. It also features user profiles with avatars and bios, alongside a dynamic feed showing the latest activities from the community.

## Tech Stack
The project is a full-stack, cross-platform application utilizing the MERN stack alongside a dedicated mobile application. 

**Backend (Server)**
* **Runtime & Framework:** Node.js with Express.js
* **Database:** MongoDB Atlas with Mongoose (ODM)
* **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs, Helmet
* **Real-time Communication:** Socket.io
* **Email Services:** Nodemailer, SendGrid

**Web Client (React)**
* **Framework:** React 18
* **Routing:** React Router DOM
* **Styling:** Tailwind CSS, PostCSS
* **Animations:** Framer Motion
* **Utilities:** Axios (API requests), date-fns, react-hot-toast, Socket.io-client

**Mobile App (Expo / React Native)**
* **Framework:** React Native with Expo (Expo Router)
* **Navigation:** React Navigation
* **Styling:** NativeWind (Tailwind for React Native)
* **Animations:** Moti, React Native Reanimated
* **Utilities:** Socket.io-client, AsyncStorage

**External APIs**
* **Movie Data:** TMDb (The Movie Database) API

## How it is Built
MovieSocial is architected as a multi-client ecosystem powered by a centralized backend system. 

**1. Centralized RESTful Backend:**
The core of the application is a Node.js/Express server that handles all business logic, user authentication, and data persistence. It connects to a cloud-hosted MongoDB Atlas database. Security is managed through bcryptjs for password hashing and stateless JSON Web Tokens (JWT) for secure user sessions. The server also integrates `Socket.io` to enable real-time features like live messaging or instant notifications across the platform.

**2. Cross-Platform Frontends:**
The application provides two distinct user interfaces that communicate with the same backend:
* **The Web Client:** Built as a Single Page Application (SPA) using React. It leverages Tailwind CSS for rapid, responsive UI development and Framer Motion for smooth component transitions. It communicates directly with the custom backend for user data and the external TMDb API to fetch rich, up-to-date movie metadata (posters, synopses, cast, etc.).
* **The Mobile App:** Built using React Native and the Expo framework, allowing the codebase to be compiled for both iOS and Android native applications. It uses Expo Router for file-based navigation and NativeWind to maintain CSS styling consistency with the web client. 

**3. Data Flow:**
When a user searches for a movie, the frontend queries the TMDb API to present accurate movie details. When a user interacts with that movie (e.g., adding it to a watchlist or posting a review), the frontend sends an authenticated Axios request to the Node.js backend. The backend verifies the JWT, processes the action, saves the relational data in MongoDB, and broadcasts any necessary real-time updates via WebSockets before responding to the client.
