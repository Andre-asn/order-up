import { gameModel } from './model';
import { lobbyModel } from '../lobby/model';
import { getGameConfig, GameConfig } from './rules';

const gameRooms = new Map(); // roomId -> gameRoom
const phaseTimers = new Map(); // roomId -> timer


export class gameRoomService {
    static async startGame(lobby: lobbyModel.lobby): Promise<gameModel.gameRoom> {
        const playerCount = lobby.players.length;
        const gamemode = lobby.gamemode;
        
        const config = getGameConfig(playerCount, gamemode);

        const { impastas, hiddenImpasta, headChef } = this.assignRoles(lobby.players.map(player => player.playerId), config);

        const gameRoom: gameModel.gameRoom = {
            ...lobby,
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
            // The last impasta in the list is the hidden one
            hiddenImpasta = impastas[impastas.length - 1];
        }
        
        if ('hasHeadChef' in config && config.hasHeadChef) {
            // Pick head chef from the good chefs (not impastas)
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
        console.log(`Timeout in ${room.roomId}, phase: ${room.currentPhase}`);
        
        switch (room.currentPhase) {
            case 'proposing':
                // Auto-skip to next proponent
                const currentProponent = this.getCurrentProponent(room);
                console.log(`Auto-skipping ${currentProponent}'s turn`);
                this.skipProposal(room.roomId, currentProponent);
                break;
                
            case 'voting':
                // Auto-reject for non-voters
                console.log(`Auto-finalizing vote`);
                this.finalizeVote(room);
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

    private static transitionToProposing(room: gameModel.gameRoom): void {
        room.currentPhase = 'proposing';
        room.phaseDeadline = Date.now() + 90000; // 90s
        this.startPhaseTimer(room);
        
        console.log(`Proposing phase - Proponent: ${this.getCurrentProponent(room)}`);
    }
    
    private static transitionToVoting(room: gameModel.gameRoom): void {
        room.currentPhase = 'voting';
        room.phaseDeadline = Date.now() + 20000; // 20s
        this.startPhaseTimer(room);
        
        console.log(`Voting phase - 20 seconds to vote`);
    }
    
    private static transitionToCooking(room: gameModel.gameRoom): void {
        room.currentPhase = 'cooking';
        room.phaseDeadline = null; // No timer in this phase, waits for selections
        room.ingredientSelections = [];
        this.startPhaseTimer(room);
        
        console.log(`Cooking phase - Waiting for chefs to throw ingredients...`);
    }
    
    private static transitionToRevealing(room: gameModel.gameRoom): void {
        room.currentPhase = 'revealing';
        room.phaseDeadline = null; // No timer
        this.clearPhaseTimer(room.roomId);
        
        const result = room.roundSuccessful[room.round - 1];
        console.log(`Revealing phase - Round ${room.round} result: ${result ? (result[0] ? 'Perfetto!' : 'Disaster!') : 'Unknown'}`);
    }
    
    private static transitionToNextRound(room: gameModel.gameRoom): void {
        // Check win condition first
        const winner = this.checkWinCondition(room);
        if (winner) {
            this.transitionToGameOver(room, winner);
            return;
        }
        
        // Move to next round
        room.round++;
        room.rejectionCount = 0;
        
        // Move to next proponent (for new round)
        this.moveToNextProponent(room);
        
        // Start proposing phase
        this.transitionToProposing(room);
        
        console.log(`Moving to Round ${room.round}`);
    }

    private static transitionToGameOver(room: gameModel.gameRoom, winner: 'chefs' | 'impastas'): void {
        room.currentPhase = 'game_over';
        room.phaseDeadline = null;
        this.clearPhaseTimer(room.roomId);
        
        console.log(`Game Over - Winner: ${winner}`);
        
        // Check for redemption (Head Chef mode)
        if (room.rules.hasHeadChef && room.rules.allowRedemption && winner === 'chefs') {
            room.currentPhase = 'redemption';
            room.phaseDeadline = Date.now() + 30000; // 30s for impastas to choose
            this.startPhaseTimer(room);
            console.log(`Redemption phase - Impastas can kill the Head Chef`);
        }
    }

    static proposeChefs(
        roomId: string,
        playerId: string,
        proposedChefs: string[]
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        // Validate
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
        
        // Create proposal
        room.roundProposal[room.round - 1] = {
            proponent: playerId,
            proposal: proposedChefs,
            votes: [],
            proposalDeadline: Date.now() + 20000,
        };
        
        // Transition to voting
        this.transitionToVoting(room);
        
        return room;
    }

    static skipProposal(roomId: string, playerId: string): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        // Validate
        if (room.currentPhase !== 'proposing') {
            throw new Error('Not in proposing phase');
        }
        if (this.getCurrentProponent(room) !== playerId) {
            throw new Error('Not your turn to skip');
        }
        
        // Increment rejection count
        room.rejectionCount++;
        
        // Check if 5 rejections (auto-fail)
        if (room.rejectionCount >= 5) {
            console.log(`❌ 5 rejections - Round ${room.round} auto-fails`);
            room.roundSuccessful[room.round - 1] = [false, 0];
            this.transitionToRevealing(room);
            return room;
        }
        
        // Move to next proponent
        this.moveToNextProponent(room);
        
        // Restart proposing phase
        this.transitionToProposing(room);
        
        return room;
    }
    
    static vote(
        roomId: string,
        playerId: string,
        inFavor: boolean
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        // Validate
        if (room.currentPhase !== 'voting') {
            throw new Error('Not in voting phase');
        }
        
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) {
            throw new Error('No active proposal');
        }
        
        // Check if already voted
        if (currentProposal.votes.some(v => v.playerId === playerId)) {
            throw new Error('Already voted');
        }
        
        // Add vote
        currentProposal.votes.push({ playerId, inFavor });
        
        // Check if everyone voted
        if (currentProposal.votes.length === room.players.length) {
            this.finalizeVote(room);
        }
        
        return room;
    }

    static finalizeVote(room: gameModel.gameRoom): void {
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) return;
        
        // Auto-reject for players who didn't vote
        const votedPlayerIds = currentProposal.votes.map(v => v.playerId);
        const missingVoters = room.players
            .map(p => p.playerId)
            .filter(id => !votedPlayerIds.includes(id));
        
        missingVoters.forEach(playerId => {
            currentProposal.votes.push({ playerId, inFavor: false });
            console.log(`Auto-rejecting for ${playerId} (didn't vote)`);
        });
        
        // Count votes
        const yesCount = currentProposal.votes.filter(v => v.inFavor).length;
        const noCount = currentProposal.votes.length - yesCount;
        const passed = yesCount > noCount;
        
        console.log(`Vote result: ${yesCount} yes, ${noCount} no - ${passed ? 'PASSED' : 'REJECTED'}`);
        
        if (passed) {
            // Proposal accepted → go to cooking
            this.transitionToCooking(room);
        } else {
            // Proposal rejected → next proponent
            room.rejectionCount++;
            
            if (room.rejectionCount >= 5) {
                console.log(`5 rejections - Round ${room.round} auto-fails`);
                room.roundSuccessful[room.round - 1] = [false, 0];
                this.transitionToRevealing(room);
            } else {
                this.moveToNextProponent(room);
                this.transitionToProposing(room);
            }
        }
    }

    static selectIngredient(
        roomId: string,
        playerId: string,
        ingredient: 'healthy' | 'rotten'
    ): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        // Validate
        if (room.currentPhase !== 'cooking') {
            throw new Error('Not in cooking phase');
        }
        
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) {
            throw new Error('No active proposal');
        }
        
        // Check if player is selected chef
        if (!currentProposal.proposal.includes(playerId)) {
            throw new Error('You were not selected to cook');
        }
        
        // Check if already selected
        if (room.ingredientSelections.some(s => s.playerId === playerId)) {
            throw new Error('Already selected ingredient');
        }
        
        // Validate ingredient choice (chefs can only pick healthy)
        if (!room.impastas.includes(playerId) && ingredient === 'rotten') {
            throw new Error('Chefs can only pick healthy ingredients');
        }
        
        // Add selection
        room.ingredientSelections.push({ playerId, ingredient });
        console.log(`${playerId} selected ${ingredient}`);
        
        // Check if all selected
        if (room.ingredientSelections.length === currentProposal.proposal.length) {
            this.finalizeCooking(room);
        }
        
        return room;
    }

    static finalizeCooking(room: gameModel.gameRoom): void {
        const currentProposal = room.roundProposal[room.round - 1];
        if (!currentProposal) return;
        
        // Calculate result
        const rottenCount = room.ingredientSelections.filter(
            s => s.ingredient === 'rotten'
        ).length;
        
        const threshold = room.rules.failureThreshold[room.round - 1];
        const success = rottenCount < threshold;
        
        room.roundSuccessful[room.round - 1] = [success, rottenCount];
        
        console.log(`Round ${room.round} result: ${rottenCount} rotten, threshold ${threshold} - ${success ? 'SUCCESS' : 'FAILURE'}`);
        
        // Transition to revealing
        this.transitionToRevealing(room);
    }
    
    // ===== Round Advancement =====
    
    static acknowledgeRoundResult(roomId: string): gameModel.gameRoom {
        const room = this.getGameRoom(roomId);
        
        if (room.currentPhase !== 'revealing') {
            throw new Error('Not in revealing phase');
        }
        
        // Check if all rounds complete
        if (room.round >= 5) {
            const winner = this.checkWinCondition(room);
            this.transitionToGameOver(room, winner || 'chefs'); // Default to chefs if tie
        } else {
            // Move to next round
            this.transitionToNextRound(room);
        }
        
        return room;
    }
    
    // Win Condition
    
    private static checkWinCondition(room: gameModel.gameRoom): 'chefs' | 'impastas' | null {
        const results = room.roundSuccessful.filter(r => r !== null) as [boolean, number][];
        
        const successCount = results.filter(r => r[0]).length;
        const failureCount = results.filter(r => !r[0]).length;
        
        if (successCount >= 3) return 'chefs';
        if (failureCount >= 3) return 'impastas';
        
        return null;
    }
    
    // Helpers
    
    static getGameRoom(roomId: string): gameModel.gameRoom {
        const room = gameRooms.get(roomId);
        if (!room) throw new Error('Game room not found');
        return room;
    }
}

