// import { gameModel } from './model'; EXAMPLE GAME ROOM MODEL

// const gameRoom: gameModel.gameRoom = {
//     roomId: "abc123",
//     hostId: "def456",
//     players: [{ playerId: "ghi789", name: "Player 1", isHost: false }, { playerId: "jkl123", name: "Player 2", isHost: false }],
//     gamemode: "Classic",
//     roomStatus: "playing",
//     impastas: ["ghi789", "jkl123"],
//     round: 1,
//     roundSuccessful: [[true, 0], [false, 1], null, null, null],
//     roundProposal: [
//         {
//             proponent: "ghi789",
//             proposal: ["123", "456", "789"],
//             votes: [{ playerId: "jkl123", inFavor: true }, { playerId: "ghi789", inFavor: false }],
//         }, null, null, null, null],
// }

import { gameModel } from './model';
import { lobbyModel } from '../lobby/model';
import { getGameConfig, GameConfig } from './rules';

const gameRooms = new Map(); // roomId -> gameRoom

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
            rejectionCount: 0,
        } as gameModel.gameRoom;
        
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
}

console.log(gameRoomService.assignRoles(['1', '2', '3', '4', '5', '6', '7'], getGameConfig(7, 'headChef')));