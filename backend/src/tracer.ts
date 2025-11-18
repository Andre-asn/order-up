import tracer from 'dd-trace'

// Configure agentless mode URL based on DD_SITE
const ddSite = process.env.DD_SITE || 'datadoghq.com'
const agentUrl = process.env.DD_TRACE_AGENT_URL || `https://trace-intake.${ddSite}`

// Initialize the Datadog tracer in agentless mode
tracer.init({
	// Service name that will appear in Datadog APM
	service: process.env.DD_SERVICE || 'order-up-backend',

	// Environment (production, staging, etc)
	env: process.env.DD_ENV || 'prod',

	// Version of your application
	version: process.env.DD_VERSION || '1.0.0',

	// Enable debug logging
	logInjection: true,

	// APM configuration
	// NOTE: runtimeMetrics disabled because Bun doesn't support all libuv functions
	runtimeMetrics: false,

	// Profiling disabled for Bun compatibility
	profiling: false,

	// Agentless mode - send directly to Datadog
	// Requires DD_API_KEY environment variable
	url: agentUrl,
})

console.log(`[Datadog] Tracer initialized in agentless mode`)
console.log(`[Datadog] Service: ${process.env.DD_SERVICE || 'order-up-backend'}`)
console.log(`[Datadog] Environment: ${process.env.DD_ENV || 'prod'}`)
console.log(`[Datadog] Agent URL: ${agentUrl}`)
console.log(`[Datadog] API Key: ${process.env.DD_API_KEY ? '***configured***' : 'MISSING - traces will not be sent'}`)

export default tracer
