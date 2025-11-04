import { Elysia } from 'elysia';
import { lobbyModel } from './model.js';
import { lobbyService } from './service.js';

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
