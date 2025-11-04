// src/modules/lobby/service.ts
import { lobbyModel } from './model';

const lobbies = new Map();

export class lobbyService {
    static async createLobby(
        data: lobbyModel.createLobbyBody
    ): Promise<{
        roomId: string;
        playerId: string;
        lobby: lobbyModel.lobby;
    }> {
        const roomId = generateRoomCode();
        const playerId = generatePlayerId();
        
        const hostPlayer: lobbyModel.player = {
            playerId,
            name: data.hostName,
            isReady: true,
            isHost: true,
        };
        
        const lobby: lobbyModel.lobby = {
            roomId,
            hostId: playerId,
            players: [hostPlayer],
            gamemode: data.gamemode,
            roomStatus: 'waiting',
        };
        
        lobbies.set(roomId, lobby);
        
        return { roomId, playerId, lobby };
    }

    static async joinLobby(
        data: lobbyModel.joinLobbyBody
    ): Promise<{
        playerId: string;
        lobby: lobbyModel.lobby;
    }> {
        const lobby = lobbies.get(data.roomId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        if (lobby.players.length >= 8) {
            throw new Error('Lobby is full');
        }

        const playerId = generatePlayerId();
        const newPlayer: lobbyModel.player = {
            playerId,
            name: data.name,
            isReady: false,
            isHost: false,
        };

        lobby.players.push(newPlayer);
        lobbies.set(data.roomId, lobby);

        return { playerId, lobby };
    }

}

function generateRoomCode(): string {
    let roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    while (lobbies.has(roomCode)) {
        roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    return roomCode;
}

function generatePlayerId(): string {
    return `player-${crypto.randomUUID()}`;
}