import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(cors())
  .use(roomModule)
  .listen(3000);