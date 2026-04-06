# Getting Started with Sfera

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## Installation

1. **Install dependencies** (already done):

```bash
npm install
```

2. **Set up Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create a Firestore Database
   - Enable Storage
   - Copy your Firebase config

3. **Configure environment variables**:

```bash
cp .env.example .env
```

Then edit `.env` and add your Firebase credentials.

4. **Start the development server**:

```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/      # Reusable UI components
├── context/         # React Context providers
├── hooks/          # Custom React hooks
├── pages/          # Main page components
├── services/       # Firebase and API services
├── utils/          # Helper functions
├── App.jsx         # Main app component
├── main.jsx        # Entry point
└── index.css       # Global styles
```

## Next Steps

1. Set up your Firebase project and add credentials to `.env`
2. Test authentication by signing up a user
3. Start building out the community features!
