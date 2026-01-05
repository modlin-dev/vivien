import { SQL, stdout, type RedisClient } from "bun"
import ansi from "ansi-colors"
import { timestamp } from "volter"

declare global {
	interface Request {
		ip: Bun.SocketAddress
	}
}

export interface HTTPLog {
	id: number
	method: string
	url: string
	status: number
	ip: string
	user_agent: string | null
	created: Date
}

export interface MonitorOptions {
	store?: RedisClient
	db?: SQL
	resolver?: (data: HTTPLog) => unknown
}
export class Monitor {
	constructor(options?: MonitorOptions) {
		this.store = options?.store ?? Bun.redis
		this.db = options?.db ?? new SQL("sqlite://:memory:")
		this.resolver = options?.resolver ?? (data => JSON.stringify(data))
	}
	store: RedisClient
	db: SQL
	resolver: (data: HTTPLog) => unknown | Promise<unknown>

	async log(request: Request, response: Response) {
		const sql = this.db
		const data: HTTPLog = {
			id: 0,
			method: request.method,
			url: request.url,
			status: response.status,
			ip: request.ip.address,
			user_agent: request.headers.get("user-agent"),
			created: new Date(),
		}
		const [log]: HTTPLog[] = await sql`
            INSERT INTO "logs" ("method", "url", "status", "ip", "user_agent")
            VALUES (${data.method}, ${data.url}, ${data.status}, ${data.ip}, ${data.user_agent})
            RETURNING *
        `
		const result = await this.resolver(log ?? data)
		if (result) stdout.write(`${result}\n`)
		else stdout.write(`${JSON.stringify(data)}\n`)
	}
	async migrate() {
		const sql = this.db
		return await sql`
            CREATE TABLE IF NOT EXISTS "logs" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT,
                "method" TEXT NOT NULL,
                "url" TEXT NOT NULL,
                "status" INTEGER NOT NULL,
                "ip" TEXT NOT NULL,
                "user_agent" TEXT,
                "created" DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `
	}
	resolve(resolver: (data: HTTPLog) => unknown | Promise<unknown>) {
		this.resolver = resolver
	}
}

export function ansi_method(method: string) {
	switch (method) {
		case "GET":
			return ansi.green(method)
		case "POST":
			return ansi.blue(method)
		case "DELETE":
			return ansi.red(method)
		default:
			return ansi.yellow(method)
	}
}
export function ansi_status(status: number) {
	const text = status.toString()
	if (status < 300) return ansi.green(text)
	if (status < 400) return ansi.blue(text)
	if (status < 500) return ansi.yellow(text)
	if (status < 600) return ansi.red(text)
	return ansi.dim(text)
}
export function ansi_log(data: HTTPLog) {
	const timestamp = new Date(data.created).toISOString().slice(0, 19).replace("T", " ")
	return `${ansi.dim(data.id.toString().padStart(2, "0"))} ${ansi.dim(timestamp)} ${ansi_method(data.method)} ${ansi.dim(data.url)} ${ansi_status(data.status)} ${ansi.red(data.ip)}`
}
