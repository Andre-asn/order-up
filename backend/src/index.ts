import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { spanProcessor } from './tracer';

const PORT = process.env.PORT || 3000;

const app = new Elysia()
	.use(opentelemetry({
		serviceName: process.env.DD_SERVICE || 'order-up-backend',
		spanProcessors: [spanProcessor],
	}))
	.get("/", () => "Hello Elysia")
	.get("/health", () => {
		const result = { status: "ok", timestamp: new Date().toISOString() };
		console.log(`[OpenTelemetry] Health check completed`);
		return result;
	})
	.use(cors())
	.use(roomModule)
	.listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);