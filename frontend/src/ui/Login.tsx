import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resetPasswordWithOtp, requestPasswordResetOtp, setCachedUser, setToken, verifyPasswordResetOtp, type Role } from './auth'
import api from '../api'
import { writePageCache } from './pageCache'

type LoginProps = {
  onLogin?: (payload: { token: string; role: Role; name: string; email: string }) => void
}

function maskEmail(email: string) {
  const at = email.indexOf('@')
  if (at < 1) return email
  const user = email.slice(0, at)
  const domain = email.slice(at + 1)
  const show = user.slice(0, Math.min(2, user.length))
  return `${show}•••@${domain}`
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('student')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rolePickerOpen, setRolePickerOpen] = useState(false)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)
  const [previewAvatarBroken, setPreviewAvatarBroken] = useState(false)
  const roleDockRef = useRef<HTMLDivElement>(null)

  // Auto-dismiss login errors so the UI stays clean.
  useEffect(() => {
    if (!error) return
    const t = window.setTimeout(() => setError(null), 5000)
    return () => window.clearTimeout(t)
  }, [error])

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStage, setForgotStage] = useState<'request' | 'verify' | 'change'>('request')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtpCode, setForgotOtpCode] = useState('')
  const [forgotCooldown, setForgotCooldown] = useState(0)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotVerifyLoading, setForgotVerifyLoading] = useState(false)
  const [forgotChanging, setForgotChanging] = useState(false)
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')

  useEffect(() => {
    setPreviewAvatarBroken(false)
  }, [previewAvatarUrl])

  useEffect(() => {
    let cancelled = false
    const id = identifier.trim()
    if (!id) {
      setPreviewAvatarUrl(null)
      return
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/login/avatar-preview?role=${encodeURIComponent(role)}&identifier=${encodeURIComponent(id)}`,
          { headers: { Accept: 'application/json' } },
        )
        const data = (await res.json().catch(() => ({}))) as { avatar_url?: string | null }
        if (cancelled) return
        setPreviewAvatarUrl(typeof data.avatar_url === 'string' && data.avatar_url ? data.avatar_url : null)
      } catch {
        if (!cancelled) setPreviewAvatarUrl(null)
      }
    }, 420)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [identifier, role])

  useEffect(() => {
    if (!rolePickerOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (roleDockRef.current && !roleDockRef.current.contains(e.target as Node)) {
        setRolePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [rolePickerOpen])

  useEffect(() => {
    if (!rolePickerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setRolePickerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [rolePickerOpen])

  useEffect(() => {
    if (!forgotOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeForgotModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [forgotOpen])

  useEffect(() => {
    if (!forgotOpen) return
    if (forgotCooldown <= 0) return
    const t = window.setInterval(() => setForgotCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(t)
  }, [forgotCooldown, forgotOpen])

  useEffect(() => {
    if (!forgotOpen) return
    if (forgotStage !== 'verify') return
    setForgotOtpCode('')
    setForgotError(null)
    setForgotVerifyLoading(false)
  }, [forgotStage, forgotOpen])

  function closeForgotModal() {
    setForgotOpen(false)
    setForgotStage('request')
    setForgotEmail('')
    setForgotOtpCode('')
    setForgotCooldown(0)
    setForgotError(null)
    setForgotSending(false)
    setForgotVerifyLoading(false)
    setForgotChanging(false)
    setForgotNewPassword('')
    setForgotConfirmPassword('')
  }

  async function warmDeanCache(): Promise<void> {
    try {
      const [dashboardRes, studentsRes, coursesRes, sectionsRes, facultyRes, eventsRes, searchRes] = await Promise.all([
        api.get('/api/dashboard/dean'),
        api.get('/api/students'),
        api.get('/api/courses'),
        api.get('/api/sections'),
        api.get('/api/faculty'),
        api.get('/api/events'),
        api.get('/api/search?q='),
      ])

      const dashboard = dashboardRes.data
      const students = (studentsRes.data?.students ?? []) as any[]
      const courses = (coursesRes.data?.courses ?? []) as any[]
      const sections = (sectionsRes.data?.sections ?? []) as any[]
      const faculty = (facultyRes.data?.faculty ?? []) as any[]
      const events = (eventsRes.data?.items ?? []) as any[]
      const search = searchRes.data ?? {}
      const subjects = Array.isArray(search?.subjects) ? search.subjects : []

      writePageCache('dean.dashboard', dashboard, 60_000)
      writePageCache('dean.scheduling', dashboard, 60_000)
      writePageCache('dean.students.core', { students, courses, sections }, 120_000)
      writePageCache('dean.reports.courses', courses, 300_000)
      writePageCache('dean.faculty.list', faculty, 120_000)
      writePageCache('dean.events', events, 120_000)
      writePageCache('dean.curriculum.subjects', subjects, 300_000)
    } catch {
      // Ignore prefetch errors; navigation should still proceed.
    }
  }

  async function warmFacultyCache(): Promise<void> {
    try {
      const [facultyDashRes, sectionsRes, studentsRes] = await Promise.all([
        api.get('/api/dashboard/faculty'),
        api.get('/api/sections'),
        api.get('/api/students'),
      ])

      const facultyDash = facultyDashRes.data ?? {}
      const schedule = Array.isArray(facultyDash?.schedule) ? facultyDash.schedule : []
      const students = Array.isArray(facultyDash?.students) ? facultyDash.students : []
      const sections = Array.isArray(sectionsRes.data?.sections) ? sectionsRes.data.sections : []

      const studentsForGrades = Array.isArray(studentsRes.data?.students) ? studentsRes.data.students : []

      writePageCache('faculty.dashboard', facultyDash, 60_000)
      writePageCache('faculty.schedule', schedule, 120_000)
      writePageCache('faculty.students.table', students, 120_000)
      writePageCache('faculty.sections', sections, 300_000)

      // Used by FacultyStudents (table + action options)
      writePageCache('faculty.students.core', { students, schedule, sections }, 120_000)

      // Used by FacultyGrades
      writePageCache('faculty.grades.context', { schedule, students: studentsForGrades }, 120_000)
    } catch {
      // Ignore prefetch errors; navigation should still proceed.
    }
  }

  async function warmStudentCache(): Promise<void> {
    try {
      const [studentDashRes, profileRes, eventsRes] = await Promise.all([
        api.get('/api/dashboard/student'),
        api.get('/api/students/me'),
        api.get('/api/events'),
      ])

      const dashboard = studentDashRes.data ?? {}
      const profile = profileRes.data?.student ?? null
      const events = Array.isArray(eventsRes.data?.items) ? eventsRes.data.items : []
      writePageCache('student.dashboard', dashboard, 60_000)
      if (profile) writePageCache('student.profile', profile, 120_000)
      writePageCache('student.events.upcoming', events, 120_000)
      writePageCache('student.subjects', Array.isArray(dashboard?.subjects) ? dashboard.subjects : [], 120_000)
      writePageCache('student.skills', Array.isArray(dashboard?.skills) ? dashboard.skills : [], 120_000)
    } catch {
      // Ignore prefetch errors; navigation should still proceed.
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ role, identifier, password }),
      })

      // Laravel may respond with JSON on validation errors.
      // Harden parsing so we still show a specific message (instead of "Network error.").
      let data:
        | { token: string; user: { role: string; name: string; email: string } }
        | { message?: string; errors?: Record<string, string[]> }
        | null = null
      try {
        data = (await res.json()) as any
      } catch {
        data = null
      }

      if (!res.ok) {
        const dataAny = (data ?? {}) as any
          const emailErr = dataAny?.errors?.email?.[0]
          const identifierErr = dataAny?.errors?.identifier?.[0]
        const passErr = dataAny?.errors?.password?.[0]
        const msg =
            identifierErr ||
            emailErr ||
          passErr ||
          dataAny?.message ||
          (res.status === 422 ? 'Invalid email or password.' : 'Login failed.')

        setError(String(msg))
        return
      }

      const dataAny = (data ?? {}) as any
      if (!dataAny?.token) {
        setError('Login failed.')
        return
      }

      const apiRole = (dataAny.user?.role || '').toLowerCase() as Role
      setToken(dataAny.token, rememberMe)
      setCachedUser(
        {
          id: 0,
          name: dataAny.user?.name,
          email: dataAny.user?.email,
          role: apiRole,
        },
        rememberMe,
      )

      onLogin?.({ token: dataAny.token, role: apiRole, name: dataAny.user?.name, email: dataAny.user?.email })

      if (apiRole === 'dean') {
        // Prime dean pages for faster navigation, but do NOT block redirect.
        // (If we await, the login UX becomes slow; we only need background warming.)
        void warmDeanCache()
      } else if (apiRole === 'faculty') {
        void warmFacultyCache()
      } else if (apiRole === 'student') {
        void warmStudentCache()
      }

      navigate(apiRole === 'dean' ? '/dean' : apiRole === 'faculty' ? '/faculty' : '/student', { replace: true })
    } catch (e) {
      setError('Network error.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendForgotOtp() {
    const email = forgotEmail.trim()
    if (!email) {
      setForgotError('Please enter your email.')
      return
    }

    setForgotSending(true)
    setForgotError(null)
    try {
      await requestPasswordResetOtp(email)
      setForgotStage('verify')
      setForgotOtpCode('')
      setForgotCooldown(60) // backend uses 60s cooldown on resend
    } catch (err) {
      const e = err as Error & { retryAfter?: number }
      if (typeof e.retryAfter === 'number') setForgotCooldown(Math.max(1, Math.ceil(e.retryAfter)))
      setForgotError(e.message || 'Could not send verification code')
    } finally {
      setForgotSending(false)
    }
  }

  async function verifyForgotOtp() {
    const digits = forgotOtpCode.replace(/\D/g, '').slice(0, 6)
    if (digits.length !== 6) {
      setForgotError('Enter the 6-digit code from your email.')
      return
    }

    setForgotVerifyLoading(true)
    setForgotError(null)
    try {
      await verifyPasswordResetOtp(forgotEmail.trim(), digits)
      setForgotStage('change')
      setForgotError(null)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setForgotVerifyLoading(false)
    }
  }

  async function submitNewPassword() {
    const pw = forgotNewPassword
    const cpw = forgotConfirmPassword

    if (pw.length < 8) {
      setForgotError('New password must be at least 8 characters.')
      return
    }
    if (pw !== cpw) {
      setForgotError('New password and confirmation do not match.')
      return
    }

    setForgotChanging(true)
    setForgotError(null)
    try {
      await resetPasswordWithOtp(forgotEmail.trim(), pw, cpw)
      closeForgotModal()
      setError('Password updated successfully. Please sign in again.')
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setForgotChanging(false)
    }
  }

  return (
    <>
      <div className="login-shell">
      <div className="login-brand-external">
        <div className="login-logo-row">
          <img src="/logo.png" alt="CCS logo" className="login-logo" />
          <div className="login-logo-text">
            <span className="login-logo-main">CCS Comprehensive Profiling</span>
            <span className="login-logo-sub">College of Computing Studies</span>
          </div>
        </div>
      </div>

      <div className="login-role-dock" ref={roleDockRef}>
        <div id="login-role-menu" className="login-role-menu" role="group" aria-label="Sign-in role" hidden={!rolePickerOpen}>
          {([
            { key: 'dean', icon: 'D', label: 'Dean' },
            { key: 'faculty', icon: 'F', label: 'Faculty' },
            { key: 'student', icon: 'S', label: 'Student' },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              className={['login-role-button', role === item.key ? 'active' : ''].join(' ')}
              onClick={() => {
                setRole(item.key)
                setRolePickerOpen(false)
              }}
            >
              <span className="login-role-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="login-role-text">{item.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="login-role-toggle"
          aria-expanded={rolePickerOpen}
          aria-controls="login-role-menu"
          aria-label={rolePickerOpen ? 'Hide role options' : 'Choose sign-in role (Dean, Faculty, or Student)'}
          title="Who is signing in?"
          onClick={() => setRolePickerOpen((v) => !v)}
        >
          <svg className="login-role-toggle-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="login-center">
        <div className="login-card login-card-split">
          <div className="login-card-form">
            <div className="login-form-main">
              <div className="login-preview-avatar" aria-hidden="true">
                <div className="login-preview-avatar-ring">
                  {previewAvatarUrl && !previewAvatarBroken ? (
                    <img
                      src={previewAvatarUrl}
                      alt=""
                      className="login-preview-avatar-img"
                      onError={() => setPreviewAvatarBroken(true)}
                    />
                  ) : (
                    <div className="login-preview-avatar-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path
                          d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 21C20 17.134 16.4183 14 12 14C7.58172 14 4 17.134 4 21"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="login-title">Sign in to your portal</div>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="identifier">Email or ID Number</label>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder={role === 'student' ? 'you@ccs.edu or 7-digit student number' : 'you@ccs.edu or 7-digit employee number'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="password">Password</label>
                  <div className="login-input-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        // Eye icon (password visible)
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M2.5 12C2.5 12 6.5 5.5 12 5.5C17.5 5.5 21.5 12 21.5 12C21.5 12 17.5 18.5 12 18.5C6.5 18.5 2.5 12 2.5 12Z"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="#f97316"
                            strokeWidth="2"
                          />
                        </svg>
                      ) : (
                        // Eye-off icon (password hidden)
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M2.5 12C2.5 12 6.5 5.5 12 5.5C13.2746 5.5 14.4442 5.84689 15.5 6.36363"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M21.5 12C21.5 12 17.5 18.5 12 18.5C9.12426 18.5 6.60217 16.8319 4.83594 15.2456"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9.88 9.88C10.52 9.24 11.5 9 12.5 9.25C13.5 9.5 14.25 10.25 14.5 11.25C14.75 12.25 14.51 13.23 13.87 13.87"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M3 3L21 21"
                            stroke="#f97316"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="login-row">
                  <label className="login-check">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <a
                    className="login-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setForgotStage('request')
                      setForgotOpen(true)
                      setForgotError(null)
                      setForgotOtpCode('')
                      setForgotCooldown(0)
                    }}
                  >
                    Forgot password?
                  </a>
                </div>

                <button type="submit" className="login-submit">
                  {isSubmitting ? 'Signing in…' : `Continue as ${role === 'dean' ? 'Dean' : role === 'faculty' ? 'Faculty' : 'Student'}`}
                </button>
              </form>

              {/*
                Render login alerts via portal so they are always visible (not clipped by the login container).
              */}
            </div>
          </div>

          <div className="login-card-art">
            <img src="/bg1.png" alt="" className="login-card-art-img" />
            <div className="login-card-art-overlay" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>

    {error
      ? createPortal(
          <div className="login-error login-error--top" role="alert">
            <div className="login-error-body">
              <span className="login-error-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 9V13"
                    stroke="#b91c1c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17H12.01"
                    stroke="#b91c1c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.3 4.86L2.64 19.07C2.26 19.79 2.78 20.65 3.6 20.65H20.4C21.22 20.65 21.74 19.79 21.36 19.07L13.7 4.86C13.29 4.11 11.71 4.11 11.3 4.86H10.3Z"
                    stroke="#b91c1c"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="login-error-text">
                <div className="login-error-title">Sign in failed</div>
                <div className="login-error-message">{error}</div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null}

    {forgotOpen
      ? createPortal(
          <div
            className="modal-overlay modal-overlay--otp"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeForgotModal()
            }}
          >
            <div
              className="modal-card modal-card--otp-verify"
              role="dialog"
              aria-modal="true"
              aria-labelledby="forgot-password-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h2 id="forgot-password-modal-title" className="modal-title">
                {forgotStage === 'request'
                  ? 'Forgot password'
                  : forgotStage === 'verify'
                    ? 'Verify your email'
                    : 'Change password'}
              </h2>
              <p className="modal-subtitle">
                {forgotStage === 'request'
                  ? 'Enter your email to receive a 6-digit verification code.'
                  : forgotStage === 'verify'
                    ? `Enter the 6-digit code we sent to ${forgotEmail ? maskEmail(forgotEmail.trim()) : 'your email'}.`
                    : 'Set a new password for your account.'}
              </p>

              {forgotStage === 'request' ? (
                <label className="profile-modal-field">
                  <span className="profile-modal-label">Email</span>
                  <input
                    type="email"
                    className="profile-modal-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </label>
              ) : null}

              {forgotStage === 'verify' ? (
                <>
                  <label className="profile-modal-field">
                    <span className="profile-modal-label">Verification code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="profile-modal-input profile-modal-input--otp"
                      value={forgotOtpCode}
                      onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      maxLength={6}
                      autoFocus
                    />
                  </label>

                  <p className="otp-modal-resend">
                    <button
                      type="button"
                      className="otp-modal-resend-btn"
                      disabled={forgotSending || forgotCooldown > 0}
                      onClick={() => void sendForgotOtp()}
                    >
                      {forgotCooldown > 0 ? `Resend code in ${forgotCooldown}s` : 'Resend code'}
                    </button>
                  </p>
                </>
              ) : null}

              {forgotStage === 'change' ? (
                <>
                  <p className="profile-modal-success profile-modal-success--inline">Email verified — you can set a new password.</p>

                  <label className="profile-modal-field">
                    <span className="profile-modal-label">New password</span>
                    <input
                      type="password"
                      className="profile-modal-input"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      autoFocus
                    />
                  </label>

                  <label className="profile-modal-field">
                    <span className="profile-modal-label">Confirm new password</span>
                    <input
                      type="password"
                      className="profile-modal-input"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                </>
              ) : null}

              {forgotError ? <div className="profile-modal-error">{forgotError}</div> : null}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn--ghost"
                  onClick={closeForgotModal}
                  disabled={forgotSending || forgotVerifyLoading || forgotChanging}
                >
                  Cancel
                </button>

                {forgotStage === 'request' ? (
                  <button
                    type="button"
                    className="modal-btn modal-btn--primary"
                    disabled={forgotSending || !forgotEmail.trim()}
                    onClick={() => void sendForgotOtp()}
                  >
                    {forgotSending ? 'Sending…' : 'Send verification code'}
                  </button>
                ) : null}

                {forgotStage === 'verify' ? (
                  <button
                    type="button"
                    className="modal-btn modal-btn--primary"
                    disabled={
                      forgotVerifyLoading || forgotOtpCode.replace(/\D/g, '').length !== 6
                    }
                    onClick={() => void verifyForgotOtp()}
                  >
                    {forgotVerifyLoading ? 'Verifying…' : 'Confirm code'}
                  </button>
                ) : null}

                {forgotStage === 'change' ? (
                  <button
                    type="button"
                    className="modal-btn modal-btn--primary"
                    disabled={forgotChanging || forgotNewPassword.length < 8 || forgotNewPassword !== forgotConfirmPassword}
                    onClick={() => void submitNewPassword()}
                  >
                    {forgotChanging ? 'Updating…' : 'Update password'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null}
      </>
  )
}

