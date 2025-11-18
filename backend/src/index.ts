import './tracer'; // must come before importing any instrumented module.

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(cors())
  .use(roomModule)
  .listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);