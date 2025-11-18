// IMPORTANT: Import tracer FIRST before any other imports
import tracer from "./tracer"; 

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

// Manual tracing middleware for Elysia
const tracingMiddleware = (app: Elysia) => {
	return app.onRequest(({ request }) => {
		const url = new URL(request.url);
		const span = tracer.startSpan('http.request', {
			tags: {
				'http.method': request.method,
				'http.url': url.pathname,
				'service.name': process.env.DD_SERVICE || 'order-up-backend',
			}
		});

		// Store span in request context for later finishing
		(request as any).__ddSpan = span;
	}).onAfterHandle(({ request, set }) => {
		const span = (request as any).__ddSpan;
		if (span) {
			const statusCode = typeof set.status === 'number' ? set.status : 200;
			span.setTag('http.status_code', statusCode);
			span.finish();
		}
	}).onError(({ request, error, set }) => {
		const span = (request as any).__ddSpan;
		if (span) {
			span.setTag('error', true);
			if (error instanceof Error) {
				span.setTag('error.message', error.message);
			}
			const statusCode = typeof set.status === 'number' ? set.status : 500;
			span.setTag('http.status_code', statusCode);
			span.finish();
		}
	});
};

const app = new Elysia()
	.use(tracingMiddleware)
	.get("/", () => "Hello Elysia")
	.get("/health", () => {
		const result = { status: "ok", timestamp: new Date().toISOString() };
		console.log(`[Health] Health check completed`);
		return result;
	})
	.use(cors())
	.use(roomModule)
	.listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);