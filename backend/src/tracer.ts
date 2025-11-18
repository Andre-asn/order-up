import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

// Configure OpenTelemetry exporter for Datadog
const datadogSite = process.env.DD_SITE || 'datadoghq.com'
const datadogApiKey = process.env.DD_API_KEY

if (!datadogApiKey) {
	console.error('[OpenTelemetry] ERROR: DD_API_KEY is not set! Traces will not be sent to Datadog.')
	console.error('[OpenTelemetry] Set it with: heroku config:set DD_API_KEY=your-key-here -a your-app-name')
}

// Create OTLP exporter pointing to Datadog's trace intake endpoint
export const traceExporter = new OTLPTraceExporter({
	url: `https://trace-intake.${datadogSite}/api/v2/traces`,
	headers: {
		'DD-API-KEY': datadogApiKey || '',
	},
})

// Create batch span processor for better performance
export const spanProcessor = new BatchSpanProcessor(traceExporter)

console.log(`[OpenTelemetry] Exporter configured`)
console.log(`[OpenTelemetry] Service: ${process.env.DD_SERVICE || 'order-up-backend'}`)
console.log(`[OpenTelemetry] Environment: ${process.env.DD_ENV || 'prod'}`)
console.log(`[OpenTelemetry] Datadog Site: ${datadogSite}`)
console.log(`[OpenTelemetry] API Key: ${datadogApiKey ? '***configured***' : 'MISSING - traces will not be sent'}`)
