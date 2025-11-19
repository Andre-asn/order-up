import * as Sentry from "@sentry/bun";

// Database operation tracking
export function trackDatabaseOperation<T>(
	operation: "get" | "set" | "delete",
	collection: string,
	key: string,
	operationFn: () => T
): T {
	return Sentry.startSpan(
		{
			name: `db.${operation}`,
			op: "db",
			attributes: {
				"db.operation": operation,
				"db.collection": collection,
				"db.key": key,
			},
		},
		() => {
			try {
				const result = operationFn();
				Sentry.setTag("db.success", "true");
				return result;
			} catch (error) {
				Sentry.setTag("db.success", "false");
				if (error instanceof Error) {
					Sentry.captureException(error);
				}
				throw error;
			}
		}
	);
}

// WebSocket event tracking
export function trackWebSocketEvent(
	event: "open" | "message" | "close",
	roomId: string,
	playerId: string,
	eventData?: Record<string, any>
): void {
	Sentry.startSpan(
		{
			name: `ws.${event}`,
			op: "websocket",
			attributes: {
				"ws.event": event,
				"ws.room_id": roomId,
				"ws.player_id": playerId,
				...(eventData && { "ws.data": JSON.stringify(eventData) }),
			},
		},
		() => {
			Sentry.setContext("websocket", {
				event,
				roomId,
				playerId,
				...(eventData && { data: eventData }),
			});
			
			Sentry.setTag("ws.event_type", event);
			Sentry.setTag("ws.room_id", roomId);
		}
	);
}

// WebSocket message tracking with span wrapping
export function trackWebSocketMessage<T>(
	messageType: string,
	roomId: string,
	playerId: string,
	handler: () => T
): T {
	return Sentry.startSpan(
		{
			name: `ws.message.${messageType}`,
			op: "websocket.message",
			attributes: {
				"ws.message_type": messageType,
				"ws.room_id": roomId,
				"ws.player_id": playerId,
			},
		},
		() => {
			Sentry.setContext("websocket.message", {
				type: messageType,
				roomId,
				playerId,
			});
			
			Sentry.setTag("ws.message_type", messageType);
			
			try {
				return handler();
			} catch (error) {
				if (error instanceof Error) {
					Sentry.captureException(error);
				}
				throw error;
			}
		}
	);
}

