import tracer from 'dd-trace'

// Initialize the Datadog tracer in agentless mode
tracer.init({
  // Service name that will appear in Datadog APM
  service: 'order-up-backend',

  // Environment (production, staging, etc)
  env: process.env.DD_ENV || 'prod',

  // Version of your application
  version: '1.0.0',

  // Enable debug logging
  logInjection: true,

  // APM configuration
  // NOTE: runtimeMetrics disabled because Bun doesn't support all libuv functions
  runtimeMetrics: false,

  // Profiling disabled for Bun compatibility
  profiling: false,

  // Agentless mode - send directly to Datadog
  // This is configured via DD_TRACE_AGENT_URL environment variable
})

console.log('[Datadog] Tracer initialized in agentless mode')

export default tracer
