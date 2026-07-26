import { FunctionsHttpError } from '@supabase/supabase-js'

export async function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      if (typeof body?.error === 'string') return body.error
    } catch {
      // resposta sem corpo JSON, usa a mensagem padrão
    }
  }
  return error instanceof Error ? error.message : fallback
}
