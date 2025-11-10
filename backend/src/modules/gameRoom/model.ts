// backend/src/modules/gameRoom/model.ts
import { t } from 'elysia'
import { lobbyModel } from '../lobby/model'
import { GameConfig } from './rules'

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

    	// Resolved, per-game rules (single source of truth stamped at start)
	const rulesSchema = t.Object({
		impastaCount: t.Number(),
		roundProposals: t.Array(t.Number(), { minItems: 5, maxItems: 5 }),
		failureThreshold: t.Array(t.Number(), { minItems: 5, maxItems: 5 }),
		// mode-specific knobs (optional so one schema fits all modes)
		impastasKnown: t.Optional(t.Number()),
		impastasHidden: t.Optional(t.Number()),
		hasHeadChef: t.Optional(t.Boolean()),
		allowRedemption: t.Optional(t.Boolean()),
	})
    
	// Now extend with game-specific state
	export const gameRoom = t.Intersect([
		lobbyModel.lobby,
		t.Object({
            rules: rulesSchema,
            impastas: t.Array(t.String()),
            hiddenImpasta: t.Nullable(t.String()),
            headChef: t.Nullable(t.String()),
			round: t.Number(),
            roundSuccessful: t.Array(t.Nullable(t.Tuple([t.Boolean(), t.Number()])), { minItems: 1, maxItems: 5 }),
            roundProposal: t.Array(t.Nullable(currentVote), { minItems: 1, maxItems: 5 }),
            rejectionCount: t.Number(),
		})
	])

	export type gameRoom = typeof gameRoom.static

}