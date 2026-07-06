# 🍽️ Food App

An AI-powered food discovery and management web application built with **React**, **TypeScript**, and **Vite**. The application provides a modern and responsive interface for exploring food items while integrating **Google Gemini AI** for intelligent features and **Supabase** for backend services.

---

## 📌 Overview

Food App is a modern web application designed to deliver an intuitive food browsing experience with AI-enhanced capabilities. The project combines a fast React frontend with Supabase services to create a scalable and responsive application.

Built using the latest frontend technologies, the application emphasizes performance, maintainability, and clean user interface design.

---

## ✨ Features

- 🍔 Browse food items
- 🔍 Search and explore dishes
- 🤖 AI-powered recommendations using Google Gemini
- 📱 Fully responsive interface
- ⚡ Fast loading with Vite
- 🎨 Modern UI with Tailwind CSS
- 📊 Interactive charts using Recharts
- 🔄 Client-side routing with React Router
- ☁️ Supabase integration
- 🧩 Component-based architecture

---

# 🛠️ Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4

## Backend Services

- Supabase

## AI Integration

- Google Gemini API

## Libraries

- React Router DOM
- Lucide React
- Recharts

## Development Tools

- ESLint (Oxlint)
- npm

---

# 📂 Project Structure

```
food-app/
│
├── public/                  # Static assets
├── src/                     # Application source code
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── assets/
│   └── App.tsx
│
├── .env                     # Environment variables
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── index.html
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/Bhavanish-Mantri/food-app.git
```

Move into the project directory.

```bash
cd food-app
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root and add your configuration.

```env
VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## Start Development Server

```bash
npm run dev
```

The application will start on

```
http://localhost:5173
```

---

# 📦 Available Scripts

### Start Development Server

```bash
npm run dev
```

### Build Project

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Run Linter

```bash
npm run lint
```

---


---

# 📚 Technologies Used

| Technology | Purpose |
|------------|---------|
| React 19 | Frontend Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Supabase | Backend Services |
| Google Gemini AI | AI Features |
| React Router | Routing |
| Lucide React | Icons |
| Recharts | Charts & Analytics |

---

# 📈 Future Enhancements

- User Authentication
- Favorites & Wishlist
- Food Reviews & Ratings
- Order History
- Dark Mode
- Payment Integration
- Admin Dashboard
- AI Meal Planning
- Nutritional Information
- Progressive Web App (PWA)

---

# 🧪 Development Workflow

1. Clone the repository.
2. Install dependencies.
3. Configure environment variables.
4. Start the development server.
5. Make changes inside the `src` directory.
6. Test the application.
7. Build for production.

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature-name
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push your branch.

```bash
git push origin feature-name
```

5. Open a Pull Request.

--- 

## Deployment Note

This project requires an AI API key and environment variables for the AI-powered features.

For security reasons, the API keys are not included in this repository.
