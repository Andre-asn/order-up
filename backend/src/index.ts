import { Elysia } from "elysia";
import { lobbyModule } from "./modules/lobby"; // ← Import your module

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(lobbyModule) // ← Register the lobby routes
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);