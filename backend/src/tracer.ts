// Datadog tracer configuration for Bun
// The Datadog Agent is installed via Heroku buildpack and runs automatically
import tracer from 'dd-trace'

// Initialize tracer - it will connect to the Datadog Agent automatically
tracer.init({

	service: process.env.DD_SERVICE || 'order-up-backend',

	env: process.env.DD_ENV || 'prod',

	runtimeMetrics: false,

	profiling: false,

	logInjection: false,

})

console.log(`[Datadog] Tracer initialized`)
console.log(`[Datadog] Service: ${process.env.DD_SERVICE || 'order-up-backend'}`)
console.log(`[Datadog] Environment: ${process.env.DD_ENV || 'prod'}`)
console.log(`[Datadog] Agent will be available via Heroku buildpack`)

export default tracer
