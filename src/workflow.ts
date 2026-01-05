import { SQLiteError } from "bun:sqlite"
import type { SQL } from "bun"
import { ZodError } from "zod"
import { ServerError, ErrorCodes } from "volter/error"

export function autofix(resolver: (error: ServerError) => void) {
	return (error: unknown) => {
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
					at: error.message.slice(i).split("."),
					code: ErrorCodes.ALREADY_EXISTS,
				})
				return resolver(serr)
			}
		}
		if (error instanceof ServerError) return resolver(error)
		const serr = new ServerError("Unexpected error", {
			code: ErrorCodes.INTERNAL_SERVER_ERROR,
		})
		console.log(error)
		return resolver(serr)
	}
}
interface Schema<T> {
	parse(data: unknown): T
}
export function workflow<T, P = T, A = string, O extends boolean = false, R = void>(options: {
	input: Schema<T>
	auth?: O
	db?: SQL
	steps: {
		auth?: (token: string) => A | Promise<A>
		transform?: (input: T, auth: O extends true ? A : A | undefined) => P | Promise<P>
		existence?: (input: T, auth: O extends true ? A : A | undefined) => unknown
		check?: (input: T, auth: O extends true ? A : A | undefined) => unknown
		select?: (input: P, auth: O extends true ? A : A | undefined) => R | Promise<R>
		insert?: (input: P, auth: O extends true ? A : A | undefined) => R | Promise<R>
	}
	onError(error: unknown): unknown
}) {
	const { transform, existence, check, select, insert, auth } = options.steps
	return {
		async run(input: T, token?: string): Promise<R> {
			try {
				const data = options.input.parse(input)
				const session = (auth && token ? await auth(token) : token) as unknown as A

				if (existence) if (!(await existence(data, session))) return null
				if (check) if (!(await check(data, session))) return null
				const refined = (transform ? await transform(data, session) : data) as unknown as P

				if (select) {
					return await select(refined, session)
				}
				if (insert) {
					return await insert(data, session)
				}
			} catch (error) {
				throw options.onError(error)
			}
		},
		async resolver(_parent: unknown, args: unknown, context: { request: Request }, _info: unknown): Promise<R> {
			try {
				const data = options.input.parse(args)
				const authorization = context.request.headers.get("authorization")
				if (options.auth && !authorization?.startsWith("Bearer ")) {
					throw new ServerError("Authorization header is not provided", {
						code: ErrorCodes.VALIDATION_FAILED,
					})
				}
				const token = authorization?.slice(7)
				const session = (auth && token ? await auth(token) : token) as unknown as A

				if (existence) if (!(await existence(data, session))) return
				if (check) if (!(await check(data, session))) return
				const refined = (transform ? await transform(data, session) : data) as unknown as P

				if (select) return await select(refined, session)
				if (insert) await insert(data, session)
			} catch (error) {
				throw options.onError(error)
			}
		},
	}
}
