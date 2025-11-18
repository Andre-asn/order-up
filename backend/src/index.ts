import './tracer'; // must come before importing any instrumented module.

import { Elysia } from "elysia";
import { roomModule } from "./modules/room";
import { cors } from "@elysiajs/cors";
import tracer from './tracer';

const PORT = process.env.PORT || 3000;

// Store spans for each request
const spanStore = new WeakMap<Request, any>();

// Middleware to track HTTP requests with Datadog
const datadogMiddleware = new Elysia({ name: 'datadog-tracing' })
	.derive(({ request }) => {
		const url = new URL(request.url);
		const span = tracer.startSpan('http.request', {
			tags: {
				'span.kind': 'server',
				'http.method': request.method,
				'http.url': request.url,
				'http.route': url.pathname,
			},
		});
		spanStore.set(request, span);
		return { datadogSpan: span };
	})
	.onAfterResponse(({ request, set, datadogSpan }) => {
		const span = datadogSpan || spanStore.get(request);
		if (span) {
			const statusCode = typeof set.status === 'number' ? set.status : 200;
			span.setTag('http.status_code', statusCode);
			if (statusCode >= 400) {
				span.setTag('error', true);
			}
			span.finish();
			spanStore.delete(request);
		}
	})
	.onError(({ error, set, request }) => {
		const span = spanStore.get(request);
		if (span) {
			span.setTag('error', true);
			if (error instanceof Error) {
				span.setTag('error.message', error.message);
				span.setTag('error.type', error.name);
			} else {
				span.setTag('error.message', String(error));
			}
			const statusCode = typeof set.status === 'number' ? set.status : 500;
			span.setTag('http.status_code', statusCode);
			span.finish();
			spanStore.delete(request);
		}
	});

const app = new Elysia()
	.use(datadogMiddleware)
	.get("/", () => "Hello Elysia")
	.get("/health", () => {
		const span = tracer.startSpan('health.check');
		try {
			const result = { status: "ok", timestamp: new Date().toISOString() };
			span.setTag('health.status', 'ok');
			span.finish();
			return result;
		} catch (error) {
			span.setTag('error', true);
			span.setTag('error.message', error instanceof Error ? error.message : String(error));
			span.finish();
			throw error;
		}
	})
	.use(cors())
	.use(roomModule)
	.listen(PORT);

console.log(`🦊 Elysia is running at http://localhost:${PORT}`);