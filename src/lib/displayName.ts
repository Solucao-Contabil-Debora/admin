export function displayNameFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const first = local.split(/[._-]/)[0] ?? local
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : email
}
