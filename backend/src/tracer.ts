// Datadog tracer configuration for Bun
// The Datadog Agent is installed via Heroku buildpack and runs automatically
import tracer from 'dd-trace'

// Initialize tracer - it will connect to the Datadog Agent automatically
tracer.init({
	// Service name
	service: process.env.DD_SERVICE || 'order-up-backend',

	// Environment
	env: process.env.DD_ENV || 'prod',

	// Disable runtime metrics since Bun doesn't support them
	runtimeMetrics: false,

	// Disable profiling since Bun doesn't support it
	profiling: false,

	// Log startup
	logInjection: false,

})

console.log(`[Datadog] Tracer initialized`)
console.log(`[Datadog] Service: ${process.env.DD_SERVICE || 'order-up-backend'}`)
console.log(`[Datadog] Environment: ${process.env.DD_ENV || 'prod'}`)
console.log(`[Datadog] Agent will be available via Heroku buildpack`)

export default tracer
