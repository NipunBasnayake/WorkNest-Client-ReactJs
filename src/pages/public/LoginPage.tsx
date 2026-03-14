import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { InputField } from '@/components/ui/InputField'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { isValidEmail } from '@/utils/validation'

interface LoginFormValues {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginErrors {
  email?: string
  password?: string
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
  rememberMe: false,
}

export function LoginPage() {
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target

    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: LoginErrors = {}

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(values.email)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    setSubmitted(Object.keys(nextErrors).length === 0)
  }

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Card className="p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Sign in</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Welcome back to WorkNest</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your company workspace and continue where your team left off.
          </p>
        </div>

        <form className="mt-8 space-y-4" noValidate onSubmit={handleSubmit}>
          <InputField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="rememberMe"
                checked={values.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              Remember me
            </label>

            <button type="button" className="text-sm font-medium text-primary transition hover:text-primary/80">
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          New to WorkNest?{' '}
          <Link className="font-medium text-primary transition hover:text-primary/80" to="/auth/register-company">
            Register your company
          </Link>
        </p>

        {submitted ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            <CheckCircle2 className="h-4 w-4" />
            Demo sign-in validated. API integration will be added in Phase 2.
          </p>
        ) : null}
      </Card>

      <Card className="hidden border-primary/20 bg-gradient-to-br from-primary/95 via-primary to-accent/90 p-8 text-primary-foreground lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/80">Productivity workspace</p>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">Keep teams connected to execution</h2>
        <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85">
          WorkNest helps your company coordinate people, tasks, and operations in a single structured workspace.
        </p>

        <ul className="mt-8 space-y-3 text-sm">
          {['Tenant-isolated workspaces', 'Role-aware workflows', 'Unified operations visibility'].map((item) => (
            <li key={item} className="flex items-center gap-2 text-primary-foreground/85">
              <span className="h-2 w-2 rounded-full bg-white/80" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
