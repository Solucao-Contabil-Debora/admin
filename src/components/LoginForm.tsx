import { useState } from 'react'
import type { FormEvent } from 'react'

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 text-zinc-500">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4.5 19.5c1-3.4 3.6-5.3 7.5-5.3s6.5 1.9 7.5 5.3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-zinc-500">
      <rect x="5" y="10.5" width="14" height="9" rx="1.75" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
        <path
          d="M3.5 12S6.5 5.5 12 5.5 20.5 12 20.5 12 17.5 18.5 12 18.5 3.5 12 3.5 12Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M3.5 12S6.5 5.5 12 5.5 20.5 12 20.5 12 17.5 18.5 12 18.5 3.5 12 3.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Área administrativa</h1>
        <p className="mt-1 text-sm text-zinc-400">Acesse sua conta para continuar</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-300">
          E-mail
        </label>
        <div className="flex items-center gap-2 rounded-md bg-zinc-800/60 px-3 focus-within:ring-2 focus-within:ring-primary-500/60">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <UserIcon />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Senha
        </label>
        <div className="flex items-center gap-2 rounded-md bg-zinc-800/60 px-3 focus-within:ring-2 focus-within:ring-primary-500/60">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="shrink-0 text-zinc-500 hover:text-zinc-300"
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gradient-to-r from-[#d4c45e] to-[#958726] px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Entrando...' : 'Entrar'}
      </button>

      <div className="flex items-center gap-3 text-xs text-zinc-600">
        <div className="h-px flex-1 bg-zinc-800" />
        ou
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-zinc-500">
        <LockIcon />
        Acesso restrito aos colaboradores
      </p>
    </form>
  )
}
