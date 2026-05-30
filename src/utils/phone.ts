export function normalizePhone(phone?: string) {
  if (!phone) return undefined
  let digits = phone.trim().replace(/\D/g, '')
  if (!digits) return undefined

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  if (digits.length === 13 && digits.startsWith('521')) {
    digits = `52${digits.slice(3)}`
  }

  if (digits.length === 13 && (digits.startsWith('044') || digits.startsWith('045'))) {
    digits = digits.slice(3)
  }

  if (digits.length === 12 && digits.startsWith('01')) {
    digits = digits.slice(2)
  }

  if (digits.length === 10) {
    digits = `52${digits}`
  }

  return `+${digits}`
}
