// backend/src/modules/gameRoom/model.ts
import { t } from 'elysia'
import { lobbyModel } from '../lobby/model'

export namespace gameModel {
    export const currentVote = t.Object({
        proponent: t.String(),
        proposal: t.Array(t.String()),
        votes: t.Array(t.Object({
            playerId: t.String(),
            inFavor: t.Boolean(),
        })),
    })

    export type currentVote = typeof currentVote.static;
    
	// Now extend with game-specific state
	export const gameRoom = t.Intersect([
		lobbyModel.lobby,
		t.Object({
            impastas: t.Array(t.String()),
			round: t.Number(),
            roundSuccessful: t.Array(t.Nullable(t.Tuple([t.Boolean(), t.Number()])), { minItems: 1, maxItems: 5 }),
            roundProposal: t.Array(t.Nullable(currentVote), { minItems: 1, maxItems: 5 }),
		})
	])

	export type gameRoom = typeof gameRoom.static

}