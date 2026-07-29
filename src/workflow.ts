import { SQLiteError } from "bun:sqlite"
import { type RedisClient, SQL, MaybePromise } from "bun"
import { ZodError } from "zod"
import { ServerError, ErrorCodes } from "volter/error"

export function autofix(resolver: (error: ServerError) => void, dev?: boolean) {
	return (error: unknown) => {
		if (dev) console.error(error)
		if (error instanceof ZodError) {
			const serr = new ServerError("Failed to validate", {
				code: ErrorCodes.VALIDATION_FAILED,
			})
			return resolver(serr)
		}
		if (error instanceof SQLiteError) {
			if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
				const i = error.message.lastIndexOf(" ") + 1
				const serr = new ServerError(error.message, {
					code: ErrorCodes.ALREADY_EXISTS,
					path: error.message.slice(i).split("."),
				})
				return resolver(serr)
			}
		}
		if (error instanceof SQL.PostgresError) {
			if (error.detail) {
				if (error.constraint?.endsWith("_unique")) {
					const serr = new ServerError(error.detail, {
						code: ErrorCodes.ALREADY_EXISTS,
						path: [error.constraint.split("_")[1] ?? ""],
					})
					return resolver(serr)
				}
				const serr = new ServerError(error.detail, {
					code: ErrorCodes.INTERNAL_SERVER_ERROR,
				})
				return resolver(serr)
			}
		}
		if (error instanceof ServerError) return resolver(error)

		const serr = new ServerError("Unexpected error", {
			code: ErrorCodes.INTERNAL_SERVER_ERROR,
		})
		return resolver(serr)
	}
}
interface Schema<T> {
	parse(data: unknown): T
}
interface vRequest<T, A> extends Request {
	json: () => Promise<T>
	auth: () => Promise<A>
}
export function workflow<T, P = T, A = string, O extends boolean = false, R = void, E = unknown>(options: {
	input: Schema<T>
	auth?: O
	db?: SQL
	store?: RedisClient
	fetch?(request: vRequest<T, A>, auth: O extends true ? A : A | undefined): MaybePromise<Response>
	steps?: {
		auth?: (token: string) => MaybePromise<A>
		transform?: (input: T, auth: O extends true ? A : A | undefined) => MaybePromise<P>
		existence?: (input: T, auth: O extends true ? A : A | undefined) => unknown
		check?: (input: T, auth: O extends true ? A : A | undefined) => unknown
		insert?: (input: P, auth: O extends true ? A : A | undefined) => MaybePromise<R>
		select?: (input: P, auth: O extends true ? A : A | undefined) => MaybePromise<R>
		update?: (input: P, auth: O extends true ? A : A | undefined) => MaybePromise<R>
		delete?: (input: P, auth: O extends true ? A : A | undefined) => MaybePromise<R>
	}
	onError(error: unknown): MaybePromise<E>
}) {
	const steps = options.steps
	const { transform, existence, check, auth } = options.steps ?? {}
	return {
		async run(input: T, token?: string) {
			try {
				const data = options.input.parse(input)
				if (steps) {
					const session = (auth && token ? await auth(token) : token) as unknown as A

					if (steps.existence) if (!(await steps.existence(data, session))) return
					if (steps.check) if (!(await steps.check(data, session))) return

					const refined = (transform ? await transform(data, session) : data) as unknown as P
					if (steps.insert) return await steps.insert(refined, session)
					if (steps.select) return await steps.select(refined, session)
					if (steps.update) return await steps.update(refined, session)
					if (steps.delete) return await steps.delete(refined, session)
				}
			} catch (error) {
				throw options.onError(error)
			}
		},
		async resolver(_parent: unknown, args: T, context: { request: Request }, _info: unknown): Promise<R> {
			try {
				const data = options.input.parse(args) // ZodError

				const authorization = context.request.headers.get("authorization")
				if (options.auth && !authorization) {
					throw new ServerError("Authorization header is required.", {
						code: ErrorCodes.AUTHORIZATION_REQUIRED,
					})
				}
				const token = authorization?.slice(7)

				if (steps) {
					const session = (auth && token ? await auth(token) : token) as unknown as A

					if (steps.existence) if (!(await steps.existence(data, session))) return
					if (steps.check) if (!(await steps.check(data, session))) return
					const refined = (transform ? await transform(data, session) : data) as unknown as P

					if (steps.insert) return await steps.insert(refined, session)
					if (steps.select) return await steps.select(refined, session)
					if (steps.update) return await steps.update(refined, session)
					if (steps.delete) return await steps.delete(refined, session)
				}
			} catch (error) {
				throw await options.onError(error)
			}
		},
		async fetch(request: Request) {
			try {
				const data = options.input.parse(await request.json())
				const authorization = request.headers.get("Authorization")

				if (options.auth) {
					if (!authorization) {
						return Response.json(
							new ServerError("Authorization header is required.", {
								code: ErrorCodes.AUTHORIZATION_REQUIRED,
							}),
							{
								status: 401,
								statusText: "Unauthorized",
							},
						)
					}
				}

				const token = authorization
				const session = (auth && token ? await auth(token) : token) as A

				if (steps) {
					if (existence) if (!(await existence(data, session))) return
					if (check) if (!(await check(data, session))) return
					const body = (transform ? await transform(data, session) : data) as unknown as P
					switch (request.method) {
						case "POST":
							if (steps.insert) return Response.json(await steps.insert(body, session))
							break
						case "GET":
							if (steps.select) return Response.json(await steps.select(body, session))
							break
						case "UPDATE":
							if (steps.update) return Response.json(await steps.update(body, session))
							break
						case "DELETE":
							if (steps.delete) return Response.json(await steps.delete(body, session))
							break
					}
				}

				const fetch = options.fetch
				if (fetch) {
					const vreq = request as vRequest<T, A>
					vreq.json = async () => data
					vreq.auth = async () => session
					return await fetch(vreq, session)
				}
			} catch (error) {
				return options.onError(error)
			}
		},
	}
}
