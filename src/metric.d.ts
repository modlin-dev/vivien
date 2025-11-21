export declare interface MonitorOptions {
	store?: Bun.RedisClient
}

export declare class Monitor {
	constructor(options?: MonitorOptions)
	store: Bun.RedisClient

	log(request: Request): Promise<void>
}
