# Grocery Notes App

A voice-powered grocery list application built with React and FastAPI.

## Features

- 🎤 Voice recognition for adding grocery items
- 📝 Create and manage multiple grocery lists
- 💰 Automatic price parsing from voice input
- 📱 Responsive design for mobile and desktop
- 🗑️ Easy item management and deletion
- 💾 Local storage for data persistence

## Tech Stack

### Frontend
- React 19
- Tailwind CSS
- Radix UI components
- Speech recognition API
- React Router

### Backend
- FastAPI
- MongoDB (Motor async driver)
- Uvicorn server
- CORS support

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+
- MongoDB (optional for backend)

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
python3 -m pip install -r requirements.txt

# Create .env file with your configuration
echo "MONGO_URL=mongodb://localhost:27017" > .env
echo "DB_NAME=grocery_notes" >> .env
echo "CORS_ORIGINS=http://localhost:3000" >> .env

# Run the server
python3 server.py
```

## Usage

1. Create a new grocery list
2. Use voice commands like "milk 85" or "bread 120"
3. The app will automatically parse item names and prices
4. Manage your lists and items with the intuitive interface

## Deployment

The app is ready for deployment to platforms like:
- Vercel (frontend)
- Railway (backend)
- Heroku
- AWS/GCP

## License

MIT License
