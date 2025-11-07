# Order Up! - Game Context

## Project Overview
A real-time multiplayer social deduction game where 6-8 players compete as chefs making soup. Some players are secretly "Impastas" trying to sabotage the dish.

**Tech Stack:**
- **Backend:** Bun + Elysia + TypeScript + WebSockets
- **Frontend:** React 19 + Vite + TypeScript + SWC

---

## Game Rules

### Players & Roles
- **6-8 players total**
- **Roles:**
  - **Chefs** (majority): Want to create perfect soup
  - **Impastas** (2-3 depending on player count): Want to sabotage

### Objective
- **Chefs win:** 3 out of 5 rounds are "Perfetto!" (all healthy ingredients)
- **Impastas win:** 3 out of 5 rounds are "Disaster!" (at least 1 rotten ingredient)

### Game Flow
1. **Voting Phase:** Players vote on which chefs will cook this round
   - Round 1: 3 chefs
   - Round 2: 4 chefs
   - Round 3: 5 chefs
   - Round 4: 4 chefs
   - Round 5: 5 chefs
2. **Cooking Phase:** Selected chefs secretly choose an ingredient
   - Chefs: Can only choose "healthy"
   - Impastas: Can choose "healthy" OR "rotten"
3. **Result Phase:** Round result revealed
   - "Perfetto!" if all healthy
   - "Disaster!" if any rotten (shows count but not who)

---

## Project Structure
```
/
├── backend/ (future - not created yet)
│   └── src/
│       └── modules/
│           ├── lobby/
│           │   ├── model.ts       # Elysia schemas & types
│           │   ├── service.ts     # Business logic
│           │   └── index.ts       # HTTP + WebSocket controllers
│           └── game/
│               ├── model.ts
│               ├── service.ts
│               └── index.ts
│
└── frontend/ (current Vite project)
    └── src/
        ├── modules/
        │   ├── lobby/
        │   │   ├── components/
        │   │   ├── hooks/
        │   │   └── types.ts
        │   └── game/
        │       ├── components/
        │       ├── hooks/
        │       └── types.ts
        ├── shared/
        │   ├── components/
        │   └── types/
        ├── services/
        │   └── websocket.ts
        └── stores/
```

---

## Architecture Patterns

### Backend (Elysia)
- **Model Layer:** Elysia validation schemas (`t.Object`) + TypeScript types
- **Service Layer:** Pure business logic (no HTTP/WS concerns)
- **Controller Layer:** HTTP routes + WebSocket handlers (I/O only)

### Module Pattern
- Each feature is a "module" (lobby, game, etc.)
- Modules are self-contained with model/service/controller

### Error Handling
- Service throws custom errors (e.g., `RoomNotFoundError`)
- Controller catches and maps to HTTP status codes
- WebSocket sends `{ type: 'error', message: '...' }`

---

## Current Implementation Status

### ✅ Lobby Module (Backend)
**Models (`model.ts`):**
- `player`: `{ playerId, name, isHost }`
- `lobby`: Contains players, roomId, gamemode, roomStatus
- HTTP DTOs: `createLobby`, `joinLobby`
- WebSocket events: `start_game`, `lobby_update`, `player_joined`, `player_left`, `game_starting`

**Service (`service.ts`):**
- `createLobby(data)`: Creates new lobby, returns `{ roomId, playerId, lobby }`
- `joinLobby(data)`: Adds player to lobby, returns `{ playerId, lobby }`
- `removePlayer(roomId, playerId)`: Handles disconnects
- `validateStartGame(lobby, playerId)`: Checks if host, 6-8 players, status = waiting

**Controller (`index.ts`):**
- `POST /lobby/create`: HTTP endpoint for creating lobby
- `POST /lobby/join`: HTTP endpoint for joining lobby
- `WS /lobby/:roomId`: WebSocket connection
  - Handles `start_game` message
  - Transitions to game

**Key Rules:**
- No "ready" button - host starts when ready
- 6-8 players required to start
- Players who disconnect have their slot go to "waiting for chef"

### 🚧 Game Module (Planned)
Will extend lobby with:
- Round tracking (5 rounds)
- Vote proposals and results
- Ingredient selection
- Role assignments (chef/impasta - hidden from clients)

### ⏳ Frontend (Not Started)
- React components for lobby/game
- WebSocket connection management
- State management (likely Zustand)

---

## Key Decisions & Conventions

### Naming
- **camelCase** for properties in DTOs (e.g., `body`, `response`)
- **PascalCase** for types (e.g., `CreateLobbyBody`)
- **Models** defined separately, then referenced in DTOs

### Type Extraction
```typescript
// ✅ Define schema
export const createLobbySuccess = t.Object({ ... })
export type createLobbySuccess = typeof createLobbySuccess.static;

// ✅ Use in DTO
export const createLobby = {
    body: t.Object({ ... }),
    response: {
        200: createLobbySuccess,
        400: errorResponse,
    },
} as const;
```

### Service Returns
Services return **raw data** (not full API response):
```typescript
// Service returns:
{ roomId, playerId, lobby }

// Controller wraps:
{ success: true, roomId, playerId, lobby }
```

### WebSocket Events
All events have a `type` field for discrimination:
```typescript
{ type: 'lobby_update', lobby: { ... } }
{ type: 'error', message: '...' }
```

---

## Important Notes

### Why Separate Service and Controller?
- **Service** = Pure business logic (testable, reusable)
- **Controller** = I/O handling (HTTP, WebSocket)
- Service can be used from HTTP, WS, CLI, tests without changes

### Why Return playerId to Client?
Players need their ID to:
1. Authorize actions ("I'm toggling MY ready state")
2. Prevent impersonation (server validates playerId matches connection)
3. Render UI correctly (show "YOU" badge)
4. Perform game actions (voting, selecting ingredients)
5. Reconnect after disconnect

### HTTP vs WebSocket
- **HTTP** for one-time setup (create/join lobby)
- **WebSocket** for real-time updates (player join/leave, game actions)

---
