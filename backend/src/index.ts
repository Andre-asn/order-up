// IMPORTANT: Import tracer FIRST before any other imports
import './tracer';

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
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