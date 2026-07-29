import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

type AuthFieldProps = {
  label: string
  htmlFor: string
  children: ReactNode
}

export function AuthField({ label, htmlFor, children }: AuthFieldProps) {
  return (
    <div className="account-auth-field">
      <label className="account-auth-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

type AuthInputProps = InputHTMLAttributes<HTMLInputElement>

export function AuthInput({ className = '', ...props }: AuthInputProps) {
  return <input className={`account-auth-input ${className}`.trim()} {...props} />
}

type PasswordInputProps = Omit<AuthInputProps, 'type'>

export function PasswordInput({ value, className = '', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="account-auth-password-wrap">
      <AuthInput
        {...props}
        value={value}
        type={visible ? 'text' : 'password'}
        className={`account-auth-input--password ${className}`.trim()}
      />
      <button
        type="button"
        className="account-auth-password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M1 1l22 22" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}
