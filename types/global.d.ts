export {}

declare global {
  interface CustomJwtSessionClaims {
    email?: string
    last_sign_in?: string
  }
}