import { ArrowLeft, ArrowRight, KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requireSupabase } from '../../../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const client = await requireSupabase()
      const { error: resetError } = await client.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      )
      if (resetError) throw resetError
      setMessage('If there’s an account for this email, a reset link is on its way.')
    } catch (cause) {
      setError(cause.message || 'We couldn’t send a reset link. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-editorial auth-editorial--small">
        <span className="auth-editorial__mark">TL<span>.</span></span>
        <div><span className="eyebrow">No worries</span><h1>It happens<br /><em>to all of us.</em></h1><p>We’ll help you find your way back in.</p></div>
        <span className="auth-editorial__foot">TRENDLAMA · DHAKA</span>
      </div>
      <div className="auth-card auth-card--centered">
        <Link className="back-link" to="/login"><ArrowLeft size={15} /> Back to sign in</Link>
        <div className="auth-icon"><KeyRound size={22} /></div>
        <span className="eyebrow">A fresh start</span>
        <h2>Forgot your password?</h2>
        <p className="auth-card__intro">Enter the email you used to sign up and we’ll send you a reset link.</p>
        {message && <div className="form-message" role="status">{message}</div>}
        {error && <div className="form-message form-message--error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email address</span>
            <span className="field__input"><Mail size={17} /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span>
          </label>
          <button className="button button--dark button--full auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending link…' : 'Send reset link'} {!submitting && <ArrowRight size={17} />}
          </button>
        </form>
      </div>
    </section>
  )
}