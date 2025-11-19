// Custom HTTP-based Datadog tracer for Bun
// Sends traces directly to the Datadog Agent via HTTP

const DD_AGENT_URL = process.env.DD_AGENT_URL || 'http://127.0.0.1:8126';
const DD_SERVICE = process.env.DD_SERVICE || 'order-up-backend';
const DD_ENV = process.env.DD_ENV || 'prod';

function generateTraceId(): string {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

function generateSpanId(): string {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

export interface Span {
	traceId: string;
	spanId: string;
	name: string;
	resource: string;
	service: string;
	startTime: bigint;
	tags: Record<string, string>;
}

export function startSpan(name: string, resource: string): Span {
	return {
		traceId: generateTraceId(),
		spanId: generateSpanId(),
		name,
		resource,
		service: DD_SERVICE,
		startTime: process.hrtime.bigint(),
		tags: {
			'env': DD_ENV,
			'service': DD_SERVICE,
		}
	};
}

export function setTag(span: Span, key: string, value: string | number): void {
	span.tags[key] = String(value);
}

export async function finishSpan(span: Span): Promise<void> {
	const endTime = process.hrtime.bigint();
	const durationNs = endTime - span.startTime;

	// Convert to Datadog trace format
	const trace = [[{
		trace_id: span.traceId,
		span_id: span.spanId,
		name: span.name,
		resource: span.resource,
		service: span.service,
		type: 'web',
		start: Number(span.startTime),
		duration: Number(durationNs),
		meta: span.tags,
		metrics: {
			'_sampling_priority_v1': 1
		},
		error: span.tags['error'] === 'true' ? 1 : 0,
	}]];

	// Send to Datadog Agent
	try {
		const response = await fetch(`${DD_AGENT_URL}/v0.4/traces`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/msgpack',
				'Datadog-Meta-Tracer-Version': '1.0.0',
				'Datadog-Meta-Lang': 'javascript',
			},
			body: JSON.stringify(trace),
		});

		if (!response.ok) {
			console.error(`[Datadog] Failed to send trace: ${response.status} ${response.statusText}`);
		} else {
			console.log(`[Datadog] Trace sent successfully for ${span.resource}`);
		}
	} catch (error) {
		console.error(`[Datadog] Error sending trace:`, error);
	}
}

console.log(`[Datadog] Custom HTTP tracer initialized`)
console.log(`[Datadog] Agent URL: ${DD_AGENT_URL}`)
console.log(`[Datadog] Service: ${DD_SERVICE}`)
console.log(`[Datadog] Environment: ${DD_ENV}`)
