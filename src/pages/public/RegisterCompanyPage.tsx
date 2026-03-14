import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InputField } from '@/components/ui/InputField'
import { isValidEmail, isValidWorkspaceKey, normalizeWorkspaceKey } from '@/utils/validation'

interface RegisterCompanyValues {
  companyName: string
  workspaceKey: string
  adminFullName: string
  adminEmail: string
  password: string
  confirmPassword: string
}

interface RegisterCompanyErrors {
  companyName?: string
  workspaceKey?: string
  adminFullName?: string
  adminEmail?: string
  password?: string
  confirmPassword?: string
}

const initialValues: RegisterCompanyValues = {
  companyName: '',
  workspaceKey: '',
  adminFullName: '',
  adminEmail: '',
  password: '',
  confirmPassword: '',
}

export function RegisterCompanyPage() {
  const [values, setValues] = useState<RegisterCompanyValues>(initialValues)
  const [errors, setErrors] = useState<RegisterCompanyErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    const nextValue = name === 'workspaceKey' ? normalizeWorkspaceKey(value) : value

    setValues((current) => ({
      ...current,
      [name]: nextValue,
    }))

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: undefined,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: RegisterCompanyErrors = {}

    if (!values.companyName.trim()) {
      nextErrors.companyName = 'Company name is required.'
    }

    if (!values.workspaceKey.trim()) {
      nextErrors.workspaceKey = 'Workspace key is required.'
    } else if (!isValidWorkspaceKey(values.workspaceKey)) {
      nextErrors.workspaceKey = 'Use lowercase letters, numbers, and hyphens only.'
    }

    if (!values.adminFullName.trim()) {
      nextErrors.adminFullName = 'Admin full name is required.'
    }

    if (!values.adminEmail.trim()) {
      nextErrors.adminEmail = 'Admin email is required.'
    } else if (!isValidEmail(values.adminEmail)) {
      nextErrors.adminEmail = 'Please enter a valid email address.'
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.'
    }

    if (!values.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    setSubmitted(Object.keys(nextErrors).length === 0)
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Company onboarding</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Create your WorkNest workspace</h1>
          <p className="text-sm text-muted-foreground">
            Set up your company tenant and admin account. You can invite teams and configure modules in Phase 2.
          </p>
        </div>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit}>
          <InputField
            label="Company name"
            name="companyName"
            placeholder="Acme Technologies"
            required
            value={values.companyName}
            onChange={handleChange}
            error={errors.companyName}
            containerClassName="sm:col-span-2"
          />

          <InputField
            label="Workspace key"
            name="workspaceKey"
            placeholder="acme-tech"
            hint="Used as your unique tenant identifier."
            required
            value={values.workspaceKey}
            onChange={handleChange}
            error={errors.workspaceKey}
          />

          <InputField
            label="Admin full name"
            name="adminFullName"
            placeholder="Jordan Lee"
            required
            value={values.adminFullName}
            onChange={handleChange}
            error={errors.adminFullName}
          />

          <InputField
            label="Admin email"
            name="adminEmail"
            type="email"
            autoComplete="email"
            placeholder="admin@company.com"
            required
            value={values.adminEmail}
            onChange={handleChange}
            error={errors.adminEmail}
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create password"
            required
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <InputField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            required
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <Button type="submit" className="sm:col-span-2">
            Register Company
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have a workspace?{' '}
          <Link className="font-medium text-primary transition hover:text-primary/80" to="/auth/login">
            Sign in
          </Link>
        </p>

        {submitted ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            <CheckCircle2 className="h-4 w-4" />
            Registration form validated. Backend onboarding will be connected in Phase 2.
          </p>
        ) : null}
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/95 via-primary to-accent/90 p-8 text-primary-foreground">
        <h2 className="font-display text-2xl font-semibold tracking-tight">What happens next?</h2>
        <div className="mt-6 space-y-4 text-sm text-primary-foreground/85">
          <p>1. Your tenant workspace is provisioned with isolated company scope.</p>
          <p>2. Admin access is prepared for team and module setup.</p>
          <p>3. You invite employees and start managing operations in one place.</p>
        </div>
        <div className="mt-8 rounded-xl border border-white/20 bg-white/10 p-4 text-sm">
          WorkNest is designed for progressive rollout: start with core workspace setup, then expand to
          business modules as your organization grows.
        </div>
      </Card>
    </div>
  )
}
