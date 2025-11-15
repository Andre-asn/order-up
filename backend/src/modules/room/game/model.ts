import { t } from 'elysia'
import { lobbyModel } from '../lobby/model'

export namespace gameModel {
    export const voteEntry = t.Object({
        playerId: t.String(),
        inFavor: t.Boolean(),
    })
    export type voteEntry = typeof voteEntry.static

    export const currentVote = t.Object({
        proponent: t.String(),
        proposal: t.Array(t.String()),
        votes: t.Array(voteEntry),
        proposalDeadline: t.Number(),
    })
    export type currentVote = typeof currentVote.static

    export const currentPhase = t.Union([
        t.Literal('proposing'),
        t.Literal('voting'),
        t.Literal('cooking'),
        t.Literal('redemption'),
        t.Literal('game_over'),
    ])
    export type currentPhase = typeof currentPhase.static

    export const ingredientSelection = t.Object({
        playerId: t.String(),
        ingredient: t.Union([
            t.Literal('healthy'),
            t.Literal('rotten')
        ]),
    })
    export type ingredientSelection = typeof ingredientSelection.static

    const rulesSchema = t.Object({
        impastaCount: t.Number(),
        roundProposals: t.Array(t.Number(), { minItems: 5, maxItems: 5 }),
        failureThreshold: t.Array(t.Number(), { minItems: 5, maxItems: 5 }),
        impastasKnown: t.Optional(t.Number()),
        impastasHidden: t.Optional(t.Number()),
        hasHeadChef: t.Optional(t.Boolean()),
        allowRedemption: t.Optional(t.Boolean()),
    })

    export const gameRoom = t.Intersect([
        lobbyModel.lobby,
        t.Object({
            rules: rulesSchema,
            
            impastas: t.Array(t.String()),
            hiddenImpasta: t.Nullable(t.String()),
            headChef: t.Nullable(t.String()),
            
            round: t.Number({ minimum: 1, maximum: 5 }),
            roundSuccessful: t.Array(
                t.Nullable(t.Tuple([t.Boolean(), t.Number()])), 
                { minItems: 5, maxItems: 5 }
            ),
            roundProposal: t.Array(
                t.Nullable(currentVote), 
                { minItems: 5, maxItems: 5 }
            ),
            
            proponentOrder: t.Array(t.String()), 
            currentProponentIndex: t.Number(), 
            rejectionCount: t.Number(), 
            
            currentPhase: currentPhase,
            phaseDeadline: t.Nullable(t.Number()),
            
            ingredientSelections: t.Array(ingredientSelection),

            redemptionImpasta: t.Nullable(t.String()),
        })
    ])
    export type gameRoom = typeof gameRoom.static

    export const wsEvents = {
        proposeChefs: t.Object({
            type: t.Literal('propose_chefs'),
            roomId: t.String(),
            playerId: t.String(),
            proposedChefs: t.Array(t.String()),
        }),
        
        skipProposal: t.Object({
            type: t.Literal('skip_proposal'),
            roomId: t.String(),
            playerId: t.String(),
        }),
        
        vote: t.Object({
            type: t.Literal('vote'),
            roomId: t.String(),
            playerId: t.String(),
            inFavor: t.Boolean(),
        }),
        
        selectIngredient: t.Object({
            type: t.Literal('select_ingredient'),
            roomId: t.String(),
            playerId: t.String(),
            ingredient: t.Union([t.Literal('healthy'), t.Literal('rotten')]),
        }),

        killChef: t.Object({
            type: t.Literal('kill_chef'),
            roomId: t.String(),
            playerId: t.String(),
            targetChefId: t.String(),
        }),

        ping: t.Object({
            type: t.Literal('ping'),
        }),

        pong: t.Object({
            type: t.Literal('pong'),
        }),

        keepalive: t.Object({
            type: t.Literal('keepalive'),
        }),

        gameUpdate: t.Object({
            type: t.Literal('game_update'),
            game: t.Any(),
        }),
        
        proposalStarted: t.Object({
            type: t.Literal('proposal_started'),
            proponent: t.String(),
            deadline: t.Number(),
        }),
        
        proposalSubmitted: t.Object({
            type: t.Literal('proposal_submitted'),
            proponent: t.String(),
            proposedChefs: t.Array(t.String()),
            deadline: t.Number(),
        }),
        
        proposalSkipped: t.Object({
            type: t.Literal('proposal_skipped'),
            skippedBy: t.String(),
            nextProponent: t.String(),
        }),
        
        voteComplete: t.Object({
            type: t.Literal('vote_complete'),
            passed: t.Boolean(),
            yesCount: t.Number(),
            noCount: t.Number(),
        }),
        
        cookingStarted: t.Object({
            type: t.Literal('cooking_started'),
            selectedChefs: t.Array(t.String()),
        }),
        
        roundComplete: t.Object({
            type: t.Literal('round_complete'),
            roundNumber: t.Number(),
            success: t.Boolean(),
            rottenCount: t.Number(),
        }),
        
        phaseChange: t.Object({
            type: t.Literal('phase_change'),
            newPhase: currentPhase,
            deadline: t.Nullable(t.Number()),
        }),
        
        timerTick: t.Object({
            type: t.Literal('timer_tick'),
            secondsRemaining: t.Number(),
        }),
        
        error: t.Object({
            type: t.Literal('error'),
            message: t.String(),
        }),
    } as const

    export type ProposeEvent = typeof wsEvents.proposeChefs.static
    export type SkipEvent = typeof wsEvents.skipProposal.static
    export type VoteEvent = typeof wsEvents.vote.static
    export type SelectIngredientEvent = typeof wsEvents.selectIngredient.static
    export type KillChefEvent = typeof wsEvents.killChef.static
}