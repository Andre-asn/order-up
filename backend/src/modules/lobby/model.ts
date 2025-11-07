import { t } from 'elysia';

export namespace lobbyModel {

    export const player = t.Object({
        playerId: t.String(),
        name: t.String({ minLength: 1, maxLength: 10 }),
        isReady: t.Boolean(),
        isHost: t.Boolean(),
    })

    export type player = typeof player.static;

    export const lobby = t.Object({
        roomId: t.String(),
        hostId: t.String(),
        players: t.Array(player, { minItems: 1, maxItems: 8 }),
        gamemode: t.Union([t.Literal('classic'), t.Literal('hidden'), t.Literal('headChef')]),
        roomStatus: t.Union([t.Literal('waiting'),t.Literal('playing'),t.Literal('finished')]),
    })

    export type lobby = typeof lobby.static;

    export const errorResponse = t.Object({
        status: t.Literal('error'),
        code: t.Number(),
        message: t.String(),
        details: t.Optional(t.String()),
    })
    export type errorResponse = typeof errorResponse.static;

    export const createLobbySuccess = t.Object({
        success: t.Literal(true),
        roomId: t.String(),
        playerId: t.String(),
        lobby: lobby,
    })
    export type createLobbySuccess = typeof createLobbySuccess.static;

    export const joinLobbySuccess = t.Object({
        success: t.Literal(true),
        playerId: t.String(),
        lobby: lobby,
    })
    export type joinLobbySuccess = typeof joinLobbySuccess.static;

    export const toggleReadySuccess = t.Object({
        success: t.Literal(true),
        lobby: lobby,
    })
    export type toggleReadySuccess = typeof toggleReadySuccess.static;

    export const createLobby = {
        body: t.Object({
        hostName: t.String({
            minLength: 1,
            maxLength: 10,
            error: 'Host name must be 1-10 characters long'
        }),
        gamemode: t.Union([
            t.Literal('classic'),
            t.Literal('hidden'),
            t.Literal('headChef')
        ], {
            error: 'Gamemode must be one of: classic, hidden, headChef'
        })
        }),
        response: {
            200: createLobbySuccess,
            400: errorResponse,
            422: errorResponse,
            500: errorResponse
        },
    } as const;

    export type createLobbyBody = typeof createLobby.body.static;

    export const joinLobby = {
        body: t.Object({
            roomId: t.String(),
            name: t.String({ minLength: 1, maxLength: 10 }),
        }),
        response: {
            200: joinLobbySuccess,
            400: errorResponse,
            404: errorResponse,
            500: errorResponse,
        },
    } as const;

    export type joinLobbyBody = typeof joinLobby.body.static;
    
    // Websockets below
    export const wsEvents = {
        
        startGame: t.Object({
            type: t.Literal('start_game'),
            roomId: t.String(),
            playerId: t.String(),
        }),
        
        lobbyUpdate: t.Object({
            type: t.Literal('lobby_update'),
            lobby: lobby,
        }),
        
        playerJoined: t.Object({
            type: t.Literal('player_joined'),
            player: player,
        }),
        
        playerLeft: t.Object({
            type: t.Literal('player_left'),
            playerId: t.String(),
        }),
        
        gameStarted: t.Object({
            type: t.Literal('game_started'),
            roomId: t.String(),
        }),
        
        error: t.Object({
            type: t.Literal('error'),
            message: t.String(),
        }),
    } as const;

    export type StartGameEvent = typeof wsEvents.startGame.static;
    export type LobbyUpdateEvent = typeof wsEvents.lobbyUpdate.static;
    export type PlayerJoinedEvent = typeof wsEvents.playerJoined.static;
    export type PlayerLeftEvent = typeof wsEvents.playerLeft.static;
    export type GameStartedEvent = typeof wsEvents.gameStarted.static;
    export type ErrorEvent = typeof wsEvents.error.static;

}

