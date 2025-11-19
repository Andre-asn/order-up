// Initialize Sentry as early as possible
import "./sentry";
import * as Sentry from "@sentry/bun";

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

// Sentry middleware to track all HTTP requests
const sentryMiddleware = new Elysia({ name: "sentry-tracing" })
	.derive(({ request }) => {
		const url = new URL(request.url);
		const method = request.method;
		const pathname = url.pathname;
		const startTime = Date.now();
		
		// Set request context
		Sentry.setContext("http.request", {
			method,
			url: request.url,
			pathname,
			headers: Object.fromEntries(request.headers.entries()),
		});
		
		// Set tags
		Sentry.setTag("http.method", method);
		Sentry.setTag("http.route", pathname);
		
		return { sentryStartTime: startTime };
	})
	.onAfterResponse(({ request, set, sentryStartTime }) => {
		const url = new URL(request.url);
		const method = request.method;
		const pathname = url.pathname;
		const statusCode = typeof set.status === "number" ? set.status : 200;
		const duration = sentryStartTime ? Date.now() - sentryStartTime : undefined;
		
		// Create a transaction for this HTTP request with full timing
		Sentry.withScope((scope) => {
			scope.setContext("http.response", {
				status_code: statusCode,
				duration_ms: duration,
			});
			
			scope.setTag("http.status_code", statusCode.toString());
			
			if (statusCode >= 400) {
				scope.setTag("http.error", "true");
			}
			
			// Create the transaction span
			Sentry.startSpan(
				{
					name: `${method} ${pathname}`,
					op: "http.server",
					attributes: {
						"http.method": method,
						"http.url": request.url,
						"http.route": pathname,
						"http.query": url.search,
						"http.status_code": statusCode,
						...(duration && { "http.duration_ms": duration }),
					},
				},
				() => {
					// Span will finish when callback completes
				}
			);
		});
	})
	.onError(({ error, code, request, set }) => {
		// Capture exception with request context
		if (error instanceof Error) {
			Sentry.withScope((scope) => {
				// Add request context
				scope.setContext("http.request", {
					method: request.method,
					url: request.url,
					headers: Object.fromEntries(request.headers.entries()),
				});
				
				// Add error context
				scope.setContext("error", {
					code,
					message: error.message,
					stack: error.stack,
				});
				
				// Set tags
				const statusCode = typeof set.status === "number" ? set.status : 500;
				scope.setTag("http.status_code", statusCode.toString());
				scope.setTag("error.type", code || "UNKNOWN");
				
				Sentry.captureException(error);
			});
		}
		
		return { error: code === "NOT_FOUND" ? "Not Found" : "Internal Server Error" };
	});

const app = new Elysia()
	.use(sentryMiddleware)
	.get("/", () => "Hello Elysia")
	.get("/health", () => {
		return Sentry.startSpan(
			{
				name: "GET /health",
				op: "http.server",
				attributes: {
					"http.method": "GET",
					"http.route": "/health",
				},
			},
			() => {
				return { status: "ok", timestamp: new Date().toISOString() };
			}
		);
	})
	.use(cors())
	.use(roomModule)
	.listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);