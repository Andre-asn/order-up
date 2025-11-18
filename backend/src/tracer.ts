import tracer from 'dd-trace'

// Initialize the Datadog tracer
tracer.init({
  // Service name that will appear in Datadog APM
  service: 'order-up-backend',

  // Environment (production, staging, etc)
  env: process.env.NODE_ENV || 'production',

  // Version of your application
  version: '1.0.0',

  // Enable debug logging (set to false in production for performance)
  logInjection: true,

  // APM configuration
  // NOTE: runtimeMetrics disabled because Bun doesn't support all libuv functions
  // See: https://github.com/oven-sh/bun/issues/2462
  runtimeMetrics: false,

  // Profiling (optional, disabled for Bun compatibility)
  profiling: false,

  // The Datadog Agent is running locally on port 8126
  hostname: 'localhost',
  port: 8126,
})

console.log('[Datadog] Tracer initialized for Bun runtime')

export default tracer
