import { Elysia, t } from 'elysia';
import { lobbyModel } from './lobby/model';
import { gameModel } from './game/model';
import { lobbyService } from './lobby/service';
import { gameRoomService } from './game/service';

const roomConnections = new Map<string, Map<string, any>>();

// Server-side keepalive to prevent Heroku idle timeout (55s)
// CRITICAL: Heroku router only counts DATA frames (not control frames like ping/pong)
// The "bytes=0" in router logs proves ping frames don't count as activity
// Must send actual JSON messages every 30s to prevent H15 timeout
setInterval(() => {
	const keepaliveMsg = JSON.stringify({ type: 'keepalive', ts: Date.now() });
	let totalConnections = 0;
	let sentCount = 0;

	roomConnections.forEach((connections) => {
		connections.forEach((ws) => {
			totalConnections++;
			try {
				ws.send(keepaliveMsg);
				sentCount++;
			} catch (error) {
				console.error('[Keepalive] Failed to send to connection:', error);
			}
		});
	});

	if (totalConnections > 0) {
		console.log(`[Keepalive] Sent data frames to ${sentCount}/${totalConnections} connections`);
	}
}, 30000);

gameRoomService.setTimeoutBroadcastCallback((roomId: string, room: any) => {
    const connections = roomConnections.get(roomId);
    if (!connections) return;

    if (room.currentPhase === 'game_over') {
        broadcastToRoom(roomId, {
            type: 'game_over',
            winner: gameRoomService.checkWinCondition(room) || 'chefs',
            impastas: room.impastas,
            headChef: room.headChef,
            players: room.players,
            roundSuccessful: room.roundSuccessful,
            round: room.round,
        });

        broadcastToRoom(roomId, {
            type: 'phase_change',
            newPhase: room.currentPhase,
            deadline: room.phaseDeadline,
        });

        broadcastToRoom(roomId, {
            type: 'game_update',
            game: getClientGameState(room),
        });

        setTimeout(() => {
            gameRoomService.deleteGameRoom(roomId);
        }, 1000);
        return;
    }

    const nextProponent = gameRoomService.getCurrentProponent(room);

    if (room.currentPhase === 'proposing') {
        broadcastToRoom(roomId, {
            type: 'proposal_skipped',
            skippedBy: 'timeout',
            nextProponent,
        });

        broadcastToRoom(roomId, {
            type: 'phase_change',
            newPhase: room.currentPhase,
            deadline: room.phaseDeadline,
        });

        broadcastToRoom(roomId, {
            type: 'proposal_started',
            proponent: nextProponent,
            deadline: room.phaseDeadline!,
        });
    } else if (room.currentPhase === 'voting') {
        const currentProposal = room.roundProposal[room.round - 1];
        if (currentProposal) {
            const yesCount = currentProposal.votes.filter((v: any) => v.inFavor).length;
            const noCount = currentProposal.votes.length - yesCount;
            const passed = yesCount > noCount;

            broadcastToRoom(roomId, {
                type: 'vote_complete',
                passed,
                yesCount,
                noCount,
            });

            if (passed) {
                broadcastToRoom(roomId, {
                    type: 'cooking_started',
                    selectedChefs: currentProposal.proposal,
                    });
            } else if (room.rejectionCount >= 5) {
                broadcastToRoom(roomId, {
                    type: 'game_over',
                    winner: 'impastas',
                    impastas: room.impastas,
                    headChef: room.headChef,
                    players: room.players,
                    roundSuccessful: room.roundSuccessful,
                    round: room.round,
                });
                setTimeout(() => {
                    gameRoomService.deleteGameRoom(roomId);
                }, 1000);
            } else {
                broadcastToRoom(roomId, {
                    type: 'proposal_started',
                    proponent: nextProponent,
                    deadline: room.phaseDeadline!,
                });
            }

            broadcastToRoom(roomId, {
                type: 'phase_change',
                newPhase: room.currentPhase,
                deadline: room.phaseDeadline,
            });
        }
    }

    broadcastToRoom(roomId, {
        type: 'game_update',
        game: getClientGameState(room),
    });
});

export const roomModule = new Elysia({ prefix: '/room' })
    .post('/create', async ({ body, set }) => {
        try {
            const { roomId, playerId, lobby } = await lobbyService.createLobby(body);
            
            return {
                success: true as const,
                roomId,
                playerId,
                lobby,
            };
        } catch (error) {
            set.status = 500;
            return {
                status: 'error' as const,
                code: 500,
                message: error instanceof Error ? error.message : 'Failed to create lobby',
            };
        }
    }, {
        body: lobbyModel.createLobby.body,
        response: lobbyModel.createLobby.response,
    })
    
    .post('/join', async ({ body, set }) => {
        try {
            const { playerId, lobby } = await lobbyService.joinLobby(body);
            
            const connections = roomConnections.get(body.roomId);
            if (connections) {
                const newPlayer = lobby.players.find(p => p.playerId === playerId)!;
                
                connections.forEach((ws) => {
                    ws.send(JSON.stringify({
                        type: 'player_joined',
                        player: newPlayer,
                    }));
                    ws.send(JSON.stringify({
                        type: 'lobby_update',
                        lobby,
                    }));
                });
            }
            
            return {
                success: true as const,
                playerId,
                lobby,
            };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const code = /not found/i.test(msg) ? 404 : 400;
            set.status = code;
            return {
                status: 'error' as const,
                code,
                message: msg || 'Failed to join lobby',
            };
        }
    }, {
        body: lobbyModel.joinLobby.body,
        response: lobbyModel.joinLobby.response,
    })
    
    .ws('/:roomId', {
        body: t.Union([
            lobbyModel.wsEvents.startGame,

            gameModel.wsEvents.keepaliveAck,
            gameModel.wsEvents.syncGame,
            gameModel.wsEvents.proposeChefs,
            gameModel.wsEvents.skipProposal,
            gameModel.wsEvents.vote,
            gameModel.wsEvents.selectIngredient,
            gameModel.wsEvents.killChef,
        ]),

        open(ws) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query?.playerId;
            
            console.log(`[Backend] WebSocket open for playerId: ${playerId}, roomId: ${roomId}`);
            
            if (!playerId) {
                console.log(`[Backend] ✗ No playerId provided, closing connection`);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Player ID required',
                }));
                ws.close();
                return;
            }
            
            try {
                let isGame = false;
                let room: any;
                
                try {
                    room = gameRoomService.getGameRoom(roomId);
                    isGame = true;
                    console.log(`[Backend] Room ${roomId} is a game room`);
                } catch {
                    room = lobbyService.getLobby(roomId);
                    isGame = false;
                    console.log(`[Backend] Room ${roomId} is a lobby`);
                }
                
                const player = room.players.find((p: any) => p.playerId === playerId);
                if (!player) {
                    console.log(`[Backend] ✗ Player ${playerId} not found in room ${roomId}`);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Player not in room',
                    }));
                    ws.close();
                    return;
                }
                
                if (!roomConnections.has(roomId)) {
                    roomConnections.set(roomId, new Map());
                }

                // Close old connection if it exists (prevents orphaned WebSockets)
                const existingConnection = roomConnections.get(roomId)!.get(playerId);
                if (existingConnection) {
                    console.log(`[Backend] Closing existing connection for ${playerId} before replacing`);
                    try {
                        existingConnection.close(1000, 'Replaced by new connection');
                    } catch (error) {
                        console.error(`[Backend] Error closing old connection:`, error);
                    }
                }

                roomConnections.get(roomId)!.set(playerId, ws);
                console.log(`[Backend] ✓ Registered connection for ${playerId} in room ${roomId}. Total connections: ${roomConnections.get(roomId)!.size}`);
                
                ws.data.query.playerId = playerId;
                ws.subscribe(`room:${roomId}`);
                
                if (isGame) {
                    gameRoomService.cancelDisconnectRemoval(roomId, playerId);
                    gameRoomService.cancelCleanup(roomId);
                    const gameRoom = room as gameModel.gameRoom;
                    
                    console.log(`[Backend] Sending game state to ${playerId} on connect`);
                    ws.send(JSON.stringify({
                        type: 'game_update',
                        game: getClientGameState(gameRoom),
                    }));
                    
                    ws.send(JSON.stringify({
                        type: 'role_reveal',
                        ...getPlayerRoleInfo(gameRoom, playerId),
                    }));
                    
                    ws.send(JSON.stringify({
                        type: 'phase_change',
                        newPhase: gameRoom.currentPhase,
                        deadline: gameRoom.phaseDeadline,
                    }));
                } else {
                    console.log(`[Backend] Sending lobby state to ${playerId} on connect`);
                    ws.send(JSON.stringify({
                        type: 'lobby_update',
                        lobby: room,
                    }));
                }
            } catch (error) {
                console.error(`[Backend] ✗ Error in open handler for ${playerId}:`, error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to connect',
                }));
                ws.close();
            }
        },
        
        async message(ws, message) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query.playerId;

            try {
                switch (message.type) {
                    case 'keepalive_ack':
                        // Client acknowledged keepalive - this creates bidirectional traffic for Heroku
                        // No action needed, just acknowledge receipt
                        break;

                    case 'sync_game': {
                        console.log(`[Backend] sync_game requested by ${playerId} for roomId: ${roomId}`);
                        try {
                            const gameRoom = gameRoomService.getGameRoom(roomId);
                            console.log(`[Backend] Game room found, sending state to ${playerId}`);

                            ws.send(JSON.stringify({
                                type: 'game_update',
                                game: getClientGameState(gameRoom),
                            }));
                            console.log(`[Backend] ✓ Sent game_update to ${playerId}`);

                            ws.send(JSON.stringify({
                                type: 'role_reveal',
                                ...getPlayerRoleInfo(gameRoom, playerId),
                            }));
                            console.log(`[Backend] ✓ Sent role_reveal to ${playerId}`);

                            ws.send(JSON.stringify({
                                type: 'phase_change',
                                newPhase: gameRoom.currentPhase,
                                deadline: gameRoom.phaseDeadline,
                            }));
                            console.log(`[Backend] ✓ Sent phase_change to ${playerId}`);
                        } catch (error) {
                            console.log(`[Backend] ✗ Game room not found for ${playerId}:`, error instanceof Error ? error.message : error);
                        }
                        break;
                    }

                    case 'start_game': {
                        const lobby = lobbyService.getLobby(roomId);
                        lobbyService.validateGameStart(lobby, playerId);

                        const gameRoom = await gameRoomService.startGame(lobby);
                        const connections = roomConnections.get(roomId);

                        console.log(`[Backend] start_game called by ${playerId}, roomId: ${roomId}`);
                        console.log(`[Backend] Connections map size: ${connections?.size || 0}`);
                        if (connections) {
                            console.log(`[Backend] Connected playerIds:`, Array.from(connections.keys()));
                            connections.forEach((clientWs, connectedPlayerId) => {
                                console.log(`[Backend] Sending messages to player ${connectedPlayerId}`);
                                
                                try {
                                    clientWs.send(JSON.stringify({
                                        type: 'game_starting',
                                        roomId,
                                    }));
                                    console.log(`[Backend] ✓ Sent game_starting to ${connectedPlayerId}`);

                                    clientWs.send(JSON.stringify({
                                        type: 'game_update',
                                        game: getClientGameState(gameRoom),
                                    }));
                                    console.log(`[Backend] ✓ Sent game_update to ${connectedPlayerId}`);

                                    clientWs.send(JSON.stringify({
                                        type: 'role_reveal',
                                        ...getPlayerRoleInfo(gameRoom, connectedPlayerId),
                                    }));
                                    console.log(`[Backend] ✓ Sent role_reveal to ${connectedPlayerId}`);

                                    clientWs.send(JSON.stringify({
                                        type: 'phase_change',
                                        newPhase: gameRoom.currentPhase,
                                        deadline: gameRoom.phaseDeadline,
                                    }));
                                    console.log(`[Backend] ✓ Sent phase_change to ${connectedPlayerId}`);
                                } catch (error) {
                                    console.error(`[Backend] ✗ Error sending to ${connectedPlayerId}:`, error);
                                }
                            });
                        } else {
                            console.log(`[Backend] ✗ No connections found for roomId: ${roomId}`);
                        }
                        break;
                    }
                    
                    case 'propose_chefs': {
                        const room = gameRoomService.proposeChefs(
                            roomId,
                            playerId,
                            message.proposedChefs
                        );
                        
                        broadcastToRoom(roomId, {
                            type: 'proposal_submitted',
                            proponent: playerId,
                            proposedChefs: message.proposedChefs,
                            deadline: room.phaseDeadline,
                        });
                        
                        broadcastToRoom(roomId, {
                            type: 'phase_change',
                            newPhase: room.currentPhase,
                            deadline: room.phaseDeadline,
                        });
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        });
                        break;
                    }
                    
                    case 'skip_proposal': {
                        const room = gameRoomService.skipProposal(roomId, playerId);
                        const nextProponent = gameRoomService.getCurrentProponent(room);
                        
                        broadcastToRoom(roomId, {
                            type: 'proposal_skipped',
                            skippedBy: playerId,
                            nextProponent,
                        });
                        
                        broadcastToRoom(roomId, {
                            type: 'phase_change',
                            newPhase: room.currentPhase,
                            deadline: room.phaseDeadline,
                        });
                        
                        broadcastToRoom(roomId, {
                            type: 'proposal_started',
                            proponent: nextProponent,
                            deadline: room.phaseDeadline!,
                        });
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        });
                        break;
                    }
                    
                    case 'vote': {
                        const room = gameRoomService.vote(roomId, playerId, message.inFavor);
                        
                        const currentProposal = room.roundProposal[room.round - 1];
                        if (currentProposal && currentProposal.votes.length === room.players.length) {
                            const yesCount = currentProposal.votes.filter(v => v.inFavor).length;
                            const noCount = currentProposal.votes.length - yesCount;
                            const passed = yesCount > noCount;
                            
                            broadcastToRoom(roomId, {
                                type: 'vote_complete',
                                passed,
                                yesCount,
                                noCount,
                            });
                            
                            if (passed) {
                                broadcastToRoom(roomId, {
                                    type: 'cooking_started',
                                    selectedChefs: currentProposal.proposal,
                                });
                            } else if (room.rejectionCount >= 5) {
                                broadcastToRoom(roomId, {
                                    type: 'game_over',
                                    winner: 'impastas',
                                    impastas: room.impastas,
                                    headChef: room.headChef,
                                    players: room.players,
                                    roundSuccessful: room.roundSuccessful,
                                    round: room.round,
                                });
                                setTimeout(() => {
                                    gameRoomService.deleteGameRoom(roomId);
                                }, 1000);
                            } else {
                                const nextProponent = gameRoomService.getCurrentProponent(room);
                                broadcastToRoom(roomId, {
                                    type: 'proposal_started',
                                    proponent: nextProponent,
                                    deadline: room.phaseDeadline!,
                                });
                            }
                            
                            broadcastToRoom(roomId, {
                                type: 'phase_change',
                                newPhase: room.currentPhase,
                                deadline: room.phaseDeadline,
                            });
                        }
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        });
                        break;
                    }
                    
                    case 'select_ingredient': {
                        const roomBefore = gameRoomService.getGameRoom(roomId);
                        const completedRound = roomBefore.round;
                        const currentProposal = roomBefore.roundProposal[completedRound - 1];
                        const wasLastSelection = currentProposal && 
                            roomBefore.ingredientSelections.length === currentProposal.proposal.length - 1;
                        
                        const room = gameRoomService.selectIngredient(
                            roomId,
                            playerId,
                            message.ingredient
                        );
                        
                        if (wasLastSelection) {
                            const result = room.roundSuccessful[completedRound - 1];
                            if (result) {
                                broadcastToRoom(roomId, {
                                    type: 'round_complete',
                                    roundNumber: completedRound,
                                    success: result[0],
                                    rottenCount: result[1] ?? 0,
                                });
                            }
                            
                            if (room.currentPhase === 'game_over') {
                                const winner = gameRoomService.checkWinCondition(room);
                                broadcastToRoom(roomId, {
                                    type: 'game_over',
                                    winner: winner || 'chefs',
                                    impastas: room.impastas,
                                    headChef: room.headChef,
                                    players: room.players,
                                    roundSuccessful: room.roundSuccessful,
                                    round: room.round,
                                });
                                setTimeout(() => {
                                    gameRoomService.deleteGameRoom(roomId);
                                }, 1000);
                            } else if (room.currentPhase === 'redemption') {
                                const connections = roomConnections.get(roomId);
                                if (connections && room.redemptionImpasta) {
                                    const impastaConnection = connections.get(room.redemptionImpasta);
                                    if (impastaConnection) {
                                        impastaConnection.send(JSON.stringify({
                                            type: 'redemption_selected',
                                        }));
                                    }
                                }
                            } else {
                                const nextProponent = gameRoomService.getCurrentProponent(room);
                                broadcastToRoom(roomId, {
                                    type: 'proposal_started',
                                    proponent: nextProponent,
                                    deadline: room.phaseDeadline!,
                                });
                            }
                            
                            broadcastToRoom(roomId, {
                                type: 'phase_change',
                                newPhase: room.currentPhase,
                                deadline: room.phaseDeadline,
                            });
                        }
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        });
                        break;
                    }

                    case 'kill_chef': {
                        const room = gameRoomService.killChef(
                            roomId,
                            playerId,
                            message.targetChefId
                        );

                        let winner: 'chefs' | 'impastas';
                        if (message.targetChefId === room.headChef) {
                            winner = 'impastas';
                        } else {
                            winner = 'chefs';
                        }

                        broadcastToRoom(roomId, {
                            type: 'game_over',
                            winner,
                            impastas: room.impastas,
                            headChef: room.headChef,
                            players: room.players,
                            roundSuccessful: room.roundSuccessful,
                            round: room.round,
                        });

                        broadcastToRoom(roomId, {
                            type: 'phase_change',
                            newPhase: room.currentPhase,
                            deadline: room.phaseDeadline,
                        });

                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        });

                        setTimeout(() => {
                            gameRoomService.deleteGameRoom(roomId);
                        }, 1000);
                        break;
                    }
                }
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                }));
            }
        },
        
        close(ws) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query.playerId;

            if (!playerId || !roomId) return;

            const connections = roomConnections.get(roomId);
            if (connections) {
                connections.delete(playerId);
                if (connections.size === 0) {
                    roomConnections.delete(roomId);
                }
            }

            try {
                const room = gameRoomService.getGameRoom(roomId);

                if (room.currentPhase === 'game_over') {
                    return;
                }

                gameRoomService.scheduleDisconnectRemoval(roomId, playerId, () => {
                    const stillConnected = roomConnections.get(roomId);
                    if (!stillConnected || stillConnected.size === 0) {
                        gameRoomService.cancelCleanup(roomId);
                        gameRoomService.deleteGameRoom(roomId);
                        return;
                    }

                    const room = gameRoomService.getGameRoom(roomId);
                    const playerIndex = room.players.findIndex((p: any) => p.playerId === playerId);
                    if (playerIndex !== -1) {
                        room.players.splice(playerIndex, 1);
                        broadcastToRoom(roomId, {
                            type: 'player_left',
                            playerId,
                        });
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        });
                    }
                });

                return;
            } catch {
            }

            try {
                const lobby = lobbyService.removePlayer(roomId, playerId);

                if (lobby) {
                    const remainingConnections = roomConnections.get(roomId);
                    if (remainingConnections) {
                        remainingConnections.forEach((clientWs) => {
                            clientWs.send(JSON.stringify({
                                type: 'player_left',
                                playerId,
                            }));
                            clientWs.send(JSON.stringify({
                                type: 'lobby_update',
                                lobby,
                            }));
                        });
                    }
                } else {
                }
            } catch (error) {
            }
        },
    });

function broadcastToRoom(roomId: string, message: any) {
    const connections = roomConnections.get(roomId);
    if (!connections) return;
    
    const messageStr = JSON.stringify(message);
    connections.forEach((ws) => ws.send(messageStr));
}

function getClientGameState(room: gameModel.gameRoom) {
    const { impastas, hiddenImpasta, headChef, redemptionImpasta, ...clientSafeRoom } = room;
    return clientSafeRoom;
}

function getPlayerRoleInfo(room: gameModel.gameRoom, playerId: string) {
    const isImpasta = room.impastas.includes(playerId);
    const isHeadChef = room.headChef === playerId;
    const isHiddenImpasta = room.hiddenImpasta === playerId;

    let knownImpastas: string[] = [];

    if (isHeadChef) {
        knownImpastas = room.impastas;
    } else if (isImpasta) {
        if ('impastasKnown' in room.rules) {
            if (!isHiddenImpasta) {
                knownImpastas = room.impastas.filter(id =>
                    id !== playerId && id !== room.hiddenImpasta
                );
            }
        } else {
            knownImpastas = room.impastas.filter(id => id !== playerId);
        }
    }
    
    return {
        yourRole: isImpasta ? ('impasta' as const) : ('chef' as const),
        isHeadChef,
        isHiddenImpasta,
        knownImpastas,
    };
}