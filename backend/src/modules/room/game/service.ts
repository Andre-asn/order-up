import { gameModel } from './model';
import { lobbyModel } from '../lobby/model';
import { getGameConfig, GameConfig } from './rules';

const gameRooms = new Map();
const phaseTimers = new Map();
const cleanupTimers = new Map();
const disconnectTimers = new Map();
let timeoutBroadcastCallback: ((roomId: string, room: gameModel.gameRoom) => void) | null = null;

export class transitionService {
    static proposingPhase(room: gameModel.gameRoom): void {
        room.currentPhase = 'proposing';
        room.phaseDeadline = Date.now() + 90000;
        gameRoomService.startPhaseTimer(room);
    }
    
    static votingPhase(room: gameModel.gameRoom): void {
        room.currentPhase = 'voting';
        room.phaseDeadline = Date.now() + 20000;
        gameRoomService.startPhaseTimer(room);
    }
    
    static cookingPhase(room: gameModel.gameRoom): void {
        room.currentPhase = 'cooking';
        room.phaseDeadline = null;
        room.ingredientSelections = [];
        gameRoomService.clearPhaseTimer(room.roomId);
    }
    
    static nextRound(room: gameModel.gameRoom): void {
        const winner = gameRoomService.checkWinCondition(room);
        if (winner) {
            this.gameOver(room, winner);
            return;
        }
        
        room.round++;
        room.rejectionCount = 0;
        
        gameRoomService.moveToNextProponent(room);
        
        this.proposingPhase(room);
    }

    static gameOver(room: gameModel.gameRoom, winner: 'chefs' | 'impastas'): void {
        room.currentPhase = 'game_over';
        room.phaseDeadline = null;
        gameRoomService.clearPhaseTimer(room.roomId);

        if (room.rules.hasHeadChef && room.rules.allowRedemption && winner === 'chefs') {
            room.currentPhase = 'redemption';
            room.phaseDeadline = Date.now() + 21000;

            const randomIndex = Math.floor(Math.random() * room.impastas.length);
            room.redemptionImpasta = room.impastas[randomIndex];

            gameRoomService.startPhaseTimer(room);
        } else {
            gameRoomService.scheduleCleanup(room.roomId);
        }
    }
}

export class gameRoomService {
    static setTimeoutBroadcastCallback(callback: (roomId: string, room: gameModel.gameRoom) => void): void {
        timeoutBroadcastCallback = callback;
    }

    static async startGame(lobby: lobbyModel.lobby): Promise<gameModel.gameRoom> {
        const playerCount = lobby.players.length;
        const gamemode = lobby.gamemode;

        const config = getGameConfig(playerCount, gamemode);

        const { impastas, hiddenImpasta, headChef } = this.assignRoles(lobby.players.map(player => player.playerId), config);

        const gameRoom: gameModel.gameRoom = {
            ...lobby,
            roomStatus: 'playing',
            rules: config,
            impastas: impastas,
            hiddenImpasta: hiddenImpasta,
            headChef: headChef,
            round: 1,
            roundSuccessful: [null, null, null, null, null],
            roundProposal: [null, null, null, null, null],
            proponentOrder: [...lobby.players.map(p => p.playerId)].sort(() => Math.random() - 0.5),
            currentProponentIndex: 0,
            rejectionCount: 0,
            currentPhase: 'proposing',
            phaseDeadline: Date.now() + 90000,
            ingredientSelections: [],
            redemptionImpasta: null,
        };

        gameRooms.set(lobby.roomId, gameRoom)
        this.startPhaseTimer(gameRoom);

        return gameRoom;
    }

    static assignRoles(playerIds: string[], config: GameConfig): { impastas: string[], hiddenImpasta: string | null, headChef: string | null } {
        const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
        
        const impastas = shuffled.slice(0, config.impastaCount);
        
        let hiddenImpasta: string | null = null;
        let headChef: string | null = null;
        
        if ('impastasHidden' in config && config.impastasHidden > 0) {
            hiddenImpasta = impastas[impastas.length - 1];
        }
        
        if ('hasHeadChef' in config && config.hasHeadChef) {
            const goodChefs = shuffled.slice(config.impastaCount);
            headChef = goodChefs[Math.floor(Math.random() * goodChefs.length)];
        }
        
        return { impastas, hiddenImpasta, headChef };    
    }

    static startPhaseTimer(room: gameModel.gameRoom): void {
        this.clearPhaseTimer(room.roomId);
        
        if (!room.phaseDeadline) return;
        
        const timeout = room.phaseDeadline - Date.now();
        if (timeout <= 0) {
            this.handlePhaseTimeout(room);
            return;
        }
        
        const timer = setTimeout(() => {
            this.handlePhaseTimeout(room);
        }, timeout);
        
        phaseTimers.set(room.roomId, timer);
    }

    static clearPhaseTimer(roomid: string): void {
        const timer = phaseTimers.get(roomid);
        if (timer) {
            clearTimeout(timer);
            phaseTimers.delete(roomid);
        }
    }

    static handlePhaseTimeout(room: gameModel.gameRoom): void {
        switch (room.currentPhase) {
            case 'proposing':
                const currentProponent = this.getCurrentProponent(room);

                room.rejectionCount++;

                if (room.rejectionCount >= 5) {
                    transitionService.gameOver(room, 'impastas');
                } else {
                    this.moveToNextProponent(room);
                    transitionService.proposingPhase(room);
                }

                if (timeoutBroadcastCallback) {
                    timeoutBroadcastCallback(room.roomId, room);
                }
                break;

            case 'voting':
                this.finalizeVote(room);

                if (timeoutBroadcastCallback) {
                    timeoutBroadcastCallback(room.roomId, room);
                }
                break;
                
            case 'redemption':
                room.currentPhase = 'game_over';
                room.phaseDeadline = null;
                this.clearPhaseTimer(room.roomId);

                if (timeoutBroadcastCallback) {
                    timeoutBroadcastCallback(room.roomId, room);
                }
                break;
        }
    }

    static getCurrentProponent(room: gameModel.gameRoom): string {
        return room.proponentOrder[room.currentProponentIndex];
    }
    
    static moveToNextProponent(room: gameModel.gameRoom): void {
        room.currentProponentIndex = 
            (room.currentProponentIndex + 1) % room.proponentOrder.length;
    }

    static proposeChefs(
        roomId: string,
        playerId: string,
        proposedChefs: string[]
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        if (room.currentPhase !== 'proposing') {
            throw new Error('Not in proposing phase');
        }
        if (this.getCurrentProponent(room) !== playerId) {
            throw new Error('Not your turn to propose');
        }
        
        const expectedCount = room.rules.roundProposals[room.round - 1];
        if (proposedChefs.length !== expectedCount) {
            throw new Error(`Must propose exactly ${expectedCount} chefs`);
        }
        
        room.roundProposal[room.round - 1] = {
            proponent: playerId,
            proposal: proposedChefs,
            votes: [],
            proposalDeadline: Date.now() + 20000,
        };
        
        transitionService.votingPhase(room);
        
        return room;
    }

    static skipProposal(roomId: string, playerId: string): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        if (room.currentPhase !== 'proposing') {
            throw new Error('Not in proposing phase');
        }
        if (this.getCurrentProponent(room) !== playerId) {
            throw new Error('Not your turn to skip');
        }
        
        this.moveToNextProponent(room);
        
        transitionService.proposingPhase(room);
        
        return room;
    }
    
    static vote(
        roomId: string,
        playerId: string,
        inFavor: boolean
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        if (room.currentPhase !== 'voting') {
            throw new Error('Not in voting phase');
        }
        
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) {
            throw new Error('No active proposal');
        }
        
        if (currentProposal.votes.some(v => v.playerId === playerId)) {
            throw new Error('Already voted');
        }
        
        currentProposal.votes.push({ playerId, inFavor });
        
        if (currentProposal.votes.length === room.players.length) {
            this.finalizeVote(room);
        }
        
        return room;
    }

    static finalizeVote(room: gameModel.gameRoom): void {
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) return;
        
        const votedPlayerIds = currentProposal.votes.map(v => v.playerId);
        const missingVoters = room.players
            .map(p => p.playerId)
            .filter(id => !votedPlayerIds.includes(id));
        
        missingVoters.forEach(playerId => {
            currentProposal.votes.push({ playerId, inFavor: false });
        });
        
        const yesCount = currentProposal.votes.filter(v => v.inFavor).length;
        const noCount = currentProposal.votes.length - yesCount;
        const passed = yesCount > noCount;
        
        if (passed) {
            transitionService.cookingPhase(room);
        } else {
            room.rejectionCount++;
            
            if (room.rejectionCount >= 5) {
                transitionService.gameOver(room, 'impastas');
            } else {
                this.moveToNextProponent(room);
                transitionService.proposingPhase(room);
            }
        }
    }

    static selectIngredient(
        roomId: string,
        playerId: string,
        ingredient: 'healthy' | 'rotten'
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        if (room.currentPhase !== 'cooking') {
            throw new Error('Not in cooking phase');
        }
        
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) {
            throw new Error('No active proposal');
        }
        
        if (!currentProposal.proposal.includes(playerId)) {
            throw new Error('You were not selected to cook');
        }
        
        if (room.ingredientSelections.some(s => s.playerId === playerId)) {
            throw new Error('Already selected ingredient');
        }
        
        if (!room.impastas.includes(playerId) && ingredient === 'rotten') {
            throw new Error('Chefs can only pick healthy ingredients');
        }
        
        room.ingredientSelections.push({ playerId, ingredient });
        
        if (room.ingredientSelections.length === currentProposal.proposal.length) {
            this.finalizeCooking(room);
        }
        
        return room;
    }

    static finalizeCooking(room: gameModel.gameRoom): void {
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) return;

        const rottenCount = room.ingredientSelections.filter(
            s => s.ingredient === 'rotten'
        ).length;

        const threshold = room.rules.failureThreshold[room.round - 1];
        const success = rottenCount < threshold;

        room.roundSuccessful[room.round - 1] = [success, rottenCount];

        if (room.round >= 5) {
            const winner = this.checkWinCondition(room);
            transitionService.gameOver(room, winner || 'chefs');
        } else {
            transitionService.nextRound(room);
        }
    }

    static killChef(
        roomId: string,
        playerId: string,
        targetChefId: string
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);

        if (room.currentPhase !== 'redemption') {
            throw new Error('Not in redemption phase');
        }

        if (room.redemptionImpasta !== playerId) {
            throw new Error('You are not the selected impasta for redemption');
        }

        const killedHeadChef = targetChefId === room.headChef;

        if (killedHeadChef) {
            room.currentPhase = 'game_over';
            room.phaseDeadline = null;
            this.clearPhaseTimer(room.roomId);
        } else {
            room.currentPhase = 'game_over';
            room.phaseDeadline = null;
            this.clearPhaseTimer(room.roomId);
        }

        return room;
    }
    
    static acknowledgeRoundResult(roomId: string): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
 
        if (room.round >= 5) {
            const winner = this.checkWinCondition(room);
            transitionService.gameOver(room, winner || 'chefs');
        } else {
            transitionService.nextRound(room);
        }
        
        return room;
    }
    
    static checkWinCondition(room: gameModel.gameRoom): 'chefs' | 'impastas' | null {
        if (room.rejectionCount >= 5) return 'impastas';

        const results = room.roundSuccessful.filter(r => r !== null) as [boolean, number][];

        const successCount = results.filter(r => r[0]).length;
        const failureCount = results.filter(r => !r[0]).length;

        if (successCount >= 3) return 'chefs';
        if (failureCount >= 3) return 'impastas';

        return null;
    }
    
    static getGameRoom(roomId: string): gameModel.gameRoom {
        const room = gameRooms.get(roomId);
        if (!room) throw new Error('Game room not found');
        return room;
    }
    
    static scheduleCleanup(roomId: string): void {
        const existing = cleanupTimers.get(roomId);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
            gameRooms.delete(roomId);
            cleanupTimers.delete(roomId);
            phaseTimers.delete(roomId);
        }, 30000);

        cleanupTimers.set(roomId, timer);
    }

    static cleanupImmediately(roomId: string): void {
        if (!gameRooms.has(roomId)) {
            return;
        }
        gameRooms.delete(roomId);
        cleanupTimers.delete(roomId);
        phaseTimers.delete(roomId);
    }

    static cancelCleanup(roomId: string): void {
        const timer = cleanupTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            cleanupTimers.delete(roomId);
        }
    }
    
    static scheduleDisconnectRemoval(roomId: string, playerId: string, onRemove: () => void): void {
        const key = `${roomId}-${playerId}`;
        const existing = disconnectTimers.get(key);
        if (existing) clearTimeout(existing);
        
        const timer = setTimeout(() => {
            disconnectTimers.delete(key);
            onRemove();
        }, 30000);
        
        disconnectTimers.set(key, timer);
    }
    
    static cancelDisconnectRemoval(roomId: string, playerId: string): void {
        const key = `${roomId}-${playerId}`;
        const timer = disconnectTimers.get(key);
        if (timer) {
            clearTimeout(timer);
            disconnectTimers.delete(key);
        }
    }
    
    static hasActiveConnections(roomId: string, connections: Map<string, any>): boolean {
        return connections && connections.size > 0;
    }
    
    static deleteGameRoom(roomId: string): void {
        if (!gameRooms.has(roomId)) return;
        gameRooms.delete(roomId);
        cleanupTimers.delete(roomId);
        phaseTimers.delete(roomId);
    }
}

