// IMPORTANT: Import tracer FIRST before any other imports
import * as tracer from "./tracer";

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
	.get("/", () => "Hello Elysia")
	.get("/health", async () => {
		// Start trace for health endpoint
		const span = tracer.startSpan('http.request', 'GET /health');
		tracer.setTag(span, 'http.method', 'GET');
		tracer.setTag(span, 'http.url', '/health');
		tracer.setTag(span, 'http.status_code', 200);

		const result = { status: "ok", timestamp: new Date().toISOString() };
		console.log(`[Health] Health check completed`);

		// Finish and send trace (don't await to avoid blocking response)
		tracer.finishSpan(span);

		return result;
	})
	.use(cors())
	.use(roomModule)
	.listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);