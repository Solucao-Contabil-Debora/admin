import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

type LoginFormProps = {
  onSubmit: (email: string, password: string) => Promise<void>
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
        <h1 className="text-2xl font-bold text-foreground">Área administrativa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para continuar</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pr-10"
          />
          <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <p className="rounded-md bg-destructive-light px-3 py-2 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Entrando...' : 'Entrar'}
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Acesso restrito aos colaboradores
      </p>
    </form>
  )
}
