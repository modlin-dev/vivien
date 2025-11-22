import { ServerError, ErrorCodes } from "volter/error"
import { ZodError, type z, type ZodSchema } from "zod"
import { SQLiteError } from "bun:sqlite"
import type { SQL } from "bun"

export function autofix(resolver: (error: ServerError) => void) {
	return (error: unknown) => {
		if (error instanceof ZodError) {
			const serr = new ServerError("Failed to validate", {
				code: ErrorCodes.VALIDATION_FAILED,
			})
			resolver(serr)
		} else if (error instanceof SQLiteError) {
			if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
				const i = error.message.lastIndexOf(" ") + 1
				const serr = new ServerError(error.message, {
					at: error.message.slice(i).split("."),
					code: ErrorCodes.ALREADY_EXISTS,
				})
				resolver(serr)
			}
		} else {
			const serr = new ServerError("Unexpected error", {
				code: ErrorCodes.INTERNAL_SERVER_ERROR,
			})
			resolver(serr)
		}
	}
}

export interface WorkflowOptions<T extends ZodSchema> {
	input?: T
	db?: SQL
	steps: {
		parse?(input: unknown): z.infer<T>
		transform?(input: z.infer<T>): z.infer<T>
		existance?(input: z.infer<T>): string
		check?(input: z.infer<T>): unknown
		insert?(input: z.infer<T>): unknown
	}
	onError(error: unknown): void
}

// SELECT * FROM users WHERE email = input

export function workflow<T extends ZodSchema>(options: WorkflowOptions<T>) {
	const { parse, transform, check, insert } = options.steps
	return {
		async run(input: z.infer<T>) {
			try {
				let data = input
				if (options.input) data = options.input.parse(data)
				if (parse) data = parse(data)
				if (transform) data = transform(data)
				if (insert) {
					if (check) {
						if (await check(data)) await insert(data)
					} else {
						await insert(data)
					}
				}
			} catch (error) {
				options.onError(error)
				return null
			}
		},
	}
}
