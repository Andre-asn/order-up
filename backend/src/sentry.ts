import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://6abb8797cb0caf443848ad91730b87eb@o4510388834205696.ingest.us.sentry.io/4510388892073984",
  tracesSampleRate: 1.0,
});
