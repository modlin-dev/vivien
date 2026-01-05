interface CardOptions {
	name: string
	number: string
	expiry: string
	cvc: string
}

export class Card {
	constructor(card: CardOptions) {
		const digits = card.number.replace(/\D/g, "")
		if (!luhn(digits)) throw new Error("Invalid card number.")
		if (!/^\d+$/.test(card.cvc)) throw new Error("Invalid CVC.")

		this.name = card.name
		this.number = digits
		this.expiry = new Date(card.expiry)
		this.cvc = card.cvc
	}
	name: string
	number: string
	expiry: Date
	cvc: string
}

/**
 * Luhn Algorithm - Validates card numbers using checksum
 * @param number - Card number as string
 * @returns boolean - True if valid, false otherwise
 */
export function luhn(number: string): boolean {
	let sum = 0
	let isEven = false

	for (let i = number.length - 1; i >= 0; i--) {
		let digit = parseInt(number[i] ?? "0", 10)

		if (isEven) {
			digit *= 2
			if (digit > 9) {
				digit -= 9
			}
		}

		sum += digit
		isEven = !isEven
	}

	return sum % 10 === 0
}
