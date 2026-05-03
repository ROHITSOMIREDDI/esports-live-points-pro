# 🎮 Esports Live Points Pro

Esports Live Points Pro is a high-performance, real-time tournament management engine designed for competitive gaming events (Free Fire, PUBG, etc.). It provides a premium interface for both viewers and administrators to track scores, manage squads, and generate professional combat reports.

## ✨ Features

- **🏆 Real-time Leaderboards**: Dynamic standings that update instantly as match results are entered. Includes tracking for Total Points, Total Kills, Matches Played, and Wins.
- **📊 Detailed Combat Reports**: Match-by-match breakdowns showing placement points, elimination points, and individual player performance.
- **🛡️ Secure Administrative Console**: Powerful "Governance Terminal" for authorized organizers to:
  - Register and manage squads/players.
  - Enter match results with automatic point calculation based on game-specific scoring systems.
  - Finalize tournaments with automated cleanup scheduling.
- **🎨 Premium UI/UX**: Built with a sleek, dark-themed aesthetic featuring glassmorphism, smooth animations (Framer Motion), and responsive layouts.
- **🔥 Firebase Integration**: Scalable backend using Firestore for real-time data sync and Firebase Hosting for lighting-fast delivery.

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Icons**: Lucide React

## 🌐 Live Access

The application is fully deployed and ready for use. You can access the official tournament engine directly via the link below:

👉 **[Esports Live Points Pro - Official Site](https://esports-points-system.web.app)**

No local installation is required for viewers or organizers. Simply navigate to the link above to start tracking matches or managing your events.

## 🤝 Open for Collaboration

We believe in the power of community-driven development! This project is open for improvements, new features, and design refinements.

**Want to contribute?**
- Feel free to branch out and propose changes.
- Suggest new game scoring systems.
- Improve the UI/UX performance.
- **Collaborators are welcome to edit this README and the codebase directly!**

## 📂 Project Structure

- `src/App.tsx`: Main application logic and UI components.
- `src/lib/firebase.ts`: Firebase initialization and Firestore error handling.
- `src/types.ts`: TypeScript interfaces for Tournaments, Teams, Players, and Results.
- `firestore.rules`: Security rules for protecting tournament data.
- `firebase.json`: Hosting and deployment configuration.

## ⚖️ Scoring System

The system currently supports standard scoring for:
- **Free Fire**: Placement points (12, 9, 8, etc.) + 1 point per kill.
- **PUBG**: Placement points (15, 12, 10, etc.) + 1 point per kill.

## 👨‍💻 Developers Corner

This project is maintained and developed by:

- **Name**: Rohit Somireddi
- **Email**: [rohitsomireddi11105@gmail.com](mailto:rohitsomireddi11105@gmail.com)
- **Instagram**: [@r_roh.it1.28](https://www.instagram.com/r_roh.it1.28/)

Feel free to reach out for collaborations, queries, or just to say hi!

## 📝 License

This project is licensed under the [MIT License](LICENSE).
