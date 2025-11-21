export interface Fingerprint {
	ip: string
	ua: string
	timestamp: Date
}

export interface MonitorOptions {
	store?: Bun.RedisClient
}

export class Monitor {
	constructor(options) {
		if (options?.store) this.store = options.store
	}
	store = Bun.redis

	async handle(request) {}
}

const monitor = new Monitor()

Bun.serve({
	hostname: "0.0.0.0",
	port: 80,
	async fetch(request) {
		await monitor.handle(request)

		return new Response("Hello, world!")
	},
})
