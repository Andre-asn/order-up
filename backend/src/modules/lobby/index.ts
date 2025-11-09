import { Elysia, t } from 'elysia';
import { lobbyModel } from './model.js';
import { lobbyService } from './service.js';

const roomConnections = new Map<string, Map<string, any>>(); //room id -> player ids

export const lobbyModule = new Elysia({ prefix: '/lobby' })
    .onError(({ error, code, status }) => {
        if (code === 'VALIDATION') {
            return status(422, {
                status: 422,
                error: code,
                message: error.message
            });
        }

        // fallback 
        return status(500, {
            status: 'error',
            code: 500,
            message: error instanceof Error ? error.message : 'Unknown error'
            });
    })
    .post(
        '/create',
        async ({ body }) => {
        const result = await lobbyService.createLobby(body);
        return {
            success: true,
            ...result,
        };
        },
        {
        body: lobbyModel.createLobby.body,
        response: {
            200: lobbyModel.createLobbySuccess,
            400: lobbyModel.errorResponse,
            502: lobbyModel.errorResponse, 
            500: lobbyModel.errorResponse,
            422: lobbyModel.errorResponse,
        },
    })
    .post(
        '/join',
        async ({ body }) => {
        const result = await lobbyService.joinLobby(body);
        return {
            success: true,
            ...result,
        };
        },
        {
        body: lobbyModel.joinLobby.body,
        response: {
            200: lobbyModel.joinLobbySuccess,
            400: lobbyModel.errorResponse,
            404: lobbyModel.errorResponse,
            500: lobbyModel.errorResponse,
        },
        }
    )
    .ws('/:roomId', {
        body: t.Union([
            lobbyModel.wsEvents.startGame,
        ]),
        
        open(ws) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query.playerId; // Pass playerId as query param
            
            if (!playerId) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Player ID required',
                }));
                ws.close();
                return;
            }
            
            try {
                // Get lobby
                const lobby = lobbyService.getLobby(roomId);
                
                // Verify player is in lobby
                const player = lobby.players.find(p => p.playerId === playerId);
                if (!player) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Player not in lobby',
                    }));
                    ws.close();
                    return;
                }
                
                // Store connection
                if (!roomConnections.has(roomId)) {
                    roomConnections.set(roomId, new Map());
                }
                roomConnections.get(roomId)!.set(playerId, ws);
                
                // Store playerId on ws for later use
                ws.data.query.playerId = playerId;
                
                // Subscribe to room
                ws.subscribe(`lobby:${roomId}`);
                
                // Broadcast to all subscribers (including this one) that a player joined,
                // then send the full updated lobby state so all clients stay in sync.
                ws.publish(`lobby:${roomId}`, JSON.stringify({
                    type: 'player_joined',
                    player,
                }));
                ws.publish(`lobby:${roomId}`, JSON.stringify({
                    type: 'lobby_update',
                    lobby,
                }));
                
                console.log(`Player ${playerId} connected to lobby ${roomId}`);
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to connect',
                }));
                ws.close();
            }
        },
        
        message(ws, message) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query.playerId;
            
            try {
                switch (message.type) {
                    case 'start_game': {
                        const lobby = lobbyService.getLobby(roomId);
                        
                        // Validate
                        lobbyService.validateGameStart(lobby, playerId);
                        
                        // Start game immediately (no countdown)
                        lobby.roomStatus = 'playing';
                        const msg = JSON.stringify({
                            type: 'game_starting',
                            roomId,
                        });
                        // TODO: Transition to game
                        // const gameRoom = GameService.startGame(lobby);

                        // Send broadcast to sender and all subscribers
                        ws.send(msg);
                        ws.publish(`lobby:${roomId}`, msg);

                        console.log(`Game starting in lobby ${roomId}`);
                        break;
                    }
                }
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'An unexpected error occurred',
                }));
            }
        },
        
        close(ws) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query.playerId;
            
            if (!playerId) return;
            
            try {
                // Remove from connections map
                const connections = roomConnections.get(roomId);
                if (connections) {
                    connections.delete(playerId);
                    if (connections.size === 0) {
                        roomConnections.delete(roomId);
                    }
                }
                
                // Remove player from lobby
                const lobby = lobbyService.removePlayer(roomId, playerId);
                
                if (lobby) {
                    // Broadcast player left
                    ws.publish(`lobby:${roomId}`, JSON.stringify({
                        type: 'player_left',
                        playerId,
                    }));
                    
                    // Broadcast updated lobby
                    ws.publish(`lobby:${roomId}`, JSON.stringify({
                        type: 'lobby_update',
                        lobby,
                    }));
                    
                    console.log(`Player ${playerId} left lobby ${roomId}`);
                }
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        },
    });
