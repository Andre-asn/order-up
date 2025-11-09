// src/modules/lobby/service.ts
import { lobbyModel } from './model';

const lobbies = new Map(); // roomId -> lobby

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
            isHost: false,
        };

        lobby.players.push(newPlayer);
        lobbies.set(data.roomId, lobby);

        return { playerId, lobby };
    }

    static removePlayer(roomId: string, playerId: string): lobbyModel.lobby | null {
        const lobby = lobbies.get(roomId);
        if (!lobby) {
            return null;
        }

        if (playerId === lobby.hostId && lobby.players.length > 0) {
            lobby.players[0].isHost = true;
            lobby.hostId = lobby.players[0].playerId;
        }

        for (const player of lobby.players) {
            if (player.playerId === playerId) {
                lobby.players.splice(lobby.players.indexOf(player), 1);
                break;
            }
        }

        if (lobby.players.length === 0) {
            this.deleteLobby(roomId);
        }

        return lobby;
    }

    static getLobby(roomId: string): lobbyModel.lobby {
        const lobby = lobbies.get(roomId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }
        return lobby;
    }

    static deleteLobby(roomId: string): void {
        lobbies.delete(roomId);
        console.log(`Lobby ${roomId} deleted`);
    }

    static canStartGame(roomId: string): boolean {
        const room = lobbies.get(roomId);
        return (room.players.length >= 6 && room.players.length <= 8)
    }

    static validateGameStart(lobby: lobbyModel.lobby, player: string): void {
        if (lobby.hostId !== player) {
            throw new Error('You are not the host!')
        }
        if (!this.canStartGame(lobby.roomId)) {
            throw new Error('You must have 6-8 players to start!')
        }
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
    return crypto.randomUUID();
}