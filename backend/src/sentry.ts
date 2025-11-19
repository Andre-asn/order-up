import * as Sentry from "@sentry/bun";

if (!process.env.SENTRY_DSN) {
	console.warn("[Sentry] SENTRY_DSN not set - Sentry will not capture events");
}

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 1.0,
	debug: process.env.NODE_ENV === "development", // Enable debug logs in dev
	beforeSendTransaction(event) {
		// Don't filter out health checks - we want to track them
		return event;
	},
});
