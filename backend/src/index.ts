// Initialize Sentry as early as possible
import "./sentry";
import * as Sentry from "@sentry/bun";

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
	.onError(({ error, code }) => {
		// Capture errors with Sentry
		if (error instanceof Error) {
			Sentry.captureException(error);
		}
		return { error: code === "NOT_FOUND" ? "Not Found" : "Internal Server Error" };
	})
	.get("/", () => "Hello Elysia")
	.get("/health", () => {
		try {
			const result = { status: "ok", timestamp: new Date().toISOString() };
			// Track health check with Sentry
			Sentry.captureMessage("Health check performed", {
				level: "info",
				tags: {
					endpoint: "/health",
					status: "ok",
				},
			});
			return result;
		} catch (e) {
			Sentry.captureException(e);
			throw e;
		}
	})
	.use(cors())
	.use(roomModule)
	.listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);