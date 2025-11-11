import { Elysia, t } from 'elysia';
import { gameModel } from './model';
import { gameRoomService } from './service';

const roomConnections = new Map<string, Map<string, any>>();

function broadcastToRoom(roomId: string, message: any, senderWs?: any) {
    const messageStr = JSON.stringify(message);
    if (senderWs) {
        senderWs.send(messageStr);
    }
    senderWs?.publish(`game:${roomId}`, messageStr);
}

function getClientGameState(room: gameModel.gameRoom) {
    const { impastas, hiddenImpasta, headChef, ...clientSafeRoom } = room;
    return clientSafeRoom;
}

function getPlayerRoleInfo(room: gameModel.gameRoom, playerId: string) {
    const isImpasta = room.impastas.includes(playerId);
    const isHeadChef = room.headChef === playerId;
    const isHiddenImpasta = room.hiddenImpasta === playerId;
    
    let knownImpastas: string[] = [];
    
    if (isHeadChef) {
        knownImpastas = room.impastas;
    } else if (isImpasta && !isHiddenImpasta) {
        if ('impastasKnown' in room.rules && room.rules.impastasKnown! > 0) {
            knownImpastas = room.impastas.filter(id => 
                id !== playerId && id !== room.hiddenImpasta
            );
        }
    }
    
    return {
        yourRole: isImpasta ? 'impasta' : 'chef',
        isHeadChef,
        knownImpastas,
    };
}

export const gameRoomModule = new Elysia({ prefix: '/game' })
    .ws('/:roomId', {
        body: t.Union([
            gameModel.wsEvents.proposeChefs,
            gameModel.wsEvents.skipProposal,
            gameModel.wsEvents.vote,
            gameModel.wsEvents.selectIngredient,
        ]),
        
        open(ws) {
            const { roomId } = ws.data.params;
            const playerId = ws.data.query?.playerId;
            
            if (!playerId) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Player ID required',
                }));
                ws.close();
                return;
            }
            
            try {
                const room = gameRoomService.getGameRoom(roomId);
                
                const player = room.players.find(p => p.playerId === playerId);
                if (!player) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Player not in game',
                    }));
                    ws.close();
                    return;
                }
                
                if (!roomConnections.has(roomId)) {
                    roomConnections.set(roomId, new Map());
                }
                roomConnections.get(roomId)!.set(playerId, ws);
                
                ws.data.query.playerId = playerId;
                ws.subscribe(`game:${roomId}`);
                
                ws.send(JSON.stringify({
                    type: 'game_update',
                    game: getClientGameState(room),
                }));
                
                const roleInfo = getPlayerRoleInfo(room, playerId);
                ws.send(JSON.stringify({
                    type: 'role_reveal',
                    ...roleInfo,
                }));
                
                ws.send(JSON.stringify({
                    type: 'phase_change',
                    newPhase: room.currentPhase,
                    deadline: room.phaseDeadline,
                }));
                
                console.log(`Player ${playerId} connected to game ${roomId}`);
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
                        }, ws);
                        
                        broadcastToRoom(roomId, {
                            type: 'phase_change',
                            newPhase: room.currentPhase,
                            deadline: room.phaseDeadline,
                        }, ws);
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        }, ws);
                        break;
                    }
                    
                    case 'skip_proposal': {
                        const room = gameRoomService.skipProposal(roomId, playerId);
                        const nextProponent = gameRoomService.getCurrentProponent(room);
                        
                        broadcastToRoom(roomId, {
                            type: 'proposal_skipped',
                            skippedBy: playerId,
                            nextProponent,
                        }, ws);
                        
                        broadcastToRoom(roomId, {
                            type: 'phase_change',
                            newPhase: room.currentPhase,
                            deadline: room.phaseDeadline,
                        }, ws);
                        
                        broadcastToRoom(roomId, {
                            type: 'proposal_started',
                            proponent: nextProponent,
                            deadline: room.phaseDeadline!,
                        }, ws);
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        }, ws);
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
                            }, ws);
                            
                            if (passed) {
                                broadcastToRoom(roomId, {
                                    type: 'cooking_started',
                                    selectedChefs: currentProposal.proposal,
                                }, ws);
                            } else if (room.rejectionCount >= 5) {
                                broadcastToRoom(roomId, {
                                    type: 'game_over',
                                    winner: 'impastas',
                                    impastas: room.impastas,
                                    headChef: room.headChef,
                                }, ws);
                            } else {
                                const nextProponent = gameRoomService.getCurrentProponent(room);
                                broadcastToRoom(roomId, {
                                    type: 'proposal_started',
                                    proponent: nextProponent,
                                    deadline: room.phaseDeadline!,
                                }, ws);
                            }
                            
                            broadcastToRoom(roomId, {
                                type: 'phase_change',
                                newPhase: room.currentPhase,
                                deadline: room.phaseDeadline,
                            }, ws);
                        }
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        }, ws);
                        break;
                    }
                    
                    case 'select_ingredient': {
                        const room = gameRoomService.selectIngredient(
                            roomId,
                            playerId,
                            message.ingredient
                        );
                        
                        const currentProposal = room.roundProposal[room.round - 1];
                        
                        if (currentProposal && 
                            room.ingredientSelections.length === currentProposal.proposal.length) {
                            const result = room.roundSuccessful[room.round - 1];
                            if (result) {
                                broadcastToRoom(roomId, {
                                    type: 'round_complete',
                                    roundNumber: room.round,
                                    success: result[0],
                                    rottenCount: result[1],
                                }, ws);
                            }
                            
                            if (room.currentPhase === 'game_over' || room.currentPhase === 'redemption') {
                                const winner = gameRoomService.checkWinCondition(room);
                                broadcastToRoom(roomId, {
                                    type: 'game_over',
                                    winner: winner || 'chefs',
                                    impastas: room.impastas,
                                    headChef: room.headChef,
                                }, ws);
                            } else {
                                const nextProponent = gameRoomService.getCurrentProponent(room);
                                broadcastToRoom(roomId, {
                                    type: 'proposal_started',
                                    proponent: nextProponent,
                                    deadline: room.phaseDeadline!,
                                }, ws);
                            }
                            
                            broadcastToRoom(roomId, {
                                type: 'phase_change',
                                newPhase: room.currentPhase,
                                deadline: room.phaseDeadline,
                            }, ws);
                        }
                        
                        broadcastToRoom(roomId, {
                            type: 'game_update',
                            game: getClientGameState(room),
                        }, ws);
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
            
            if (!playerId) return;
            
            const connections = roomConnections.get(roomId);
            if (connections) {
                connections.delete(playerId);
                if (connections.size === 0) {
                    roomConnections.delete(roomId);
                }
            }
            
            console.log(`Player ${playerId} disconnected from game ${roomId}`);
            
            // TODO: Handle reconnection grace period or player removal
        },
    });