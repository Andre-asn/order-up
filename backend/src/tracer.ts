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
  runtimeMetrics: true,

  // Profiling (optional, can be enabled for deeper insights)
  profiling: false,

  // The Datadog Agent is running locally on port 8126
  hostname: 'localhost',
  port: 8126,
})

console.log('[Datadog] Tracer initialized')

export default tracer
