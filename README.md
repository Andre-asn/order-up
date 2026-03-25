<img width="1661" height="584" alt="readme logo" src="https://github.com/user-attachments/assets/d571b21b-fadb-46f4-bd05-0a9bead1d98a" />

[![Build Status](https://github.com/andre-asn/order-up/actions/workflows/main.yml/badge.svg)](https://github.com/andre-asn/order-up/actions/workflows/main.yml)

> **Note**  
> **Development Status:** Order Up! is currently in active development. The backend lobby system is functional, and most game room mechanics are complete, just fleshing out some UI components. Contributions and feedback are welcome!

**Order Up!** is a real-time multiplayer social deduction game where 6-8 players compete as chefs trying to create the perfect soup. But beware - some chefs are secretly "Impastas" trying to sabotage the dish! Built with modern web technologies for a seamless, mobile-responsive experience.

---

## 🎮 Game Overview

A group of chefs are in charge of creating tonight's special soup for a crucial restaurant critique. Over 5 rounds, players must vote on who cooks each round and secretly choose ingredients to add to the soup.

**Objective:**
- **Chefs:** Get 3 out of 5 rounds to be "Perfecto!" (all healthy ingredients)
- **Impastas:** Sabotage 3 out of 5 rounds with rotten ingredients

**Game Flow:**
1. **Voting Phase:** Players vote on which chefs will cook (example: 3→4→5→4→5 chefs per round for a 6 player game)
2. **Cooking Phase:** Selected chefs secretly choose healthy or rotten ingredients (impastas can choose either one, and chefs can only select healthy!)
3. **Result Phase:** Round outcome revealed - "Perfecto!" or "Disaster!" with rotten count

---

## 🛠 Tech Stack

**Backend:**
- **Runtime:** Bun
- **Framework:** Elysia (with TypeScript)
- **Real-time:** WebSockets
- **Deployment:** Heroku
- **Monitoring:** Sentry

**Frontend:**
- **Framework:** React 19
- **Build Tool:** Vite 7 + SWC
- **Language:** TypeScript

---

## 📡 API Example

### Create a Lobby
```typescript
// POST /lobby/create
{
  "hostName": "Chef Mario",
  "gamemode": "classic"
}

// Response
{
  "success": true,
  "roomId": "ABC123",
  "playerId": "player-uuid-here",
  "lobby": {
    "roomId": "ABC123",
    "hostId": "player-uuid-here",
    "players": [
      {
        "playerId": "player-uuid-here",
        "name": "Chef Mario",
        "isReady": true,
        "isHost": true
      }
    ],
    "gamemode": "classic",
    "roomStatus": "waiting"
  }
}
```

### Join a Lobby
```typescript
// POST /lobby/join
{
  "roomId": "ABC123",
  "name": "Chef Luigi"
}
```

### WebSocket Events
```typescript
// Connect to ws://localhost:3000/lobby/:roomId

// Client → Server
{
  "type": "start_game",
  "roomId": "ABC123",
  "playerId": "player-uuid-here"
}

// Server → Client
{
  "type": "lobby_update",
  "lobby": { /* updated lobby state */ }
}
```

---

## 📁 Project Structure

```
/
├── backend/                 # Elysia backend
│   └── src/
│       ├── index.ts        # App entry point
│       └── modules/
│           └── room/
│               ├── lobby/      # Lobby management
│               │   ├── model.ts
│               │   ├── service.ts
│               ├── gameRoom/   # Game logic
│               │   ├── model.ts
│               │   ├── service.ts
│               │   └── rules.ts
│               └── index.ts/   # Controller
│
└── frontend/               # React frontend (current Vite project)
    └── src/
        ├── pages/
        ├── styles/
        └── contexts/
```

---

## 🙏 Acknowledgments

- Heavily inspired by [Mindnight](https://store.steampowered.com/app/667870/MINDNIGHT/) - a steam game by [No Moon](https://store.steampowered.com/curator/33161768)

---

**Made with ❤️**
