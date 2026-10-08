import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { requireSupabase } from '../../../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Those passwords don’t match yet.')
      return
    }

    setSubmitting(true)
    try {
      const client = await requireSupabase()
      const { error: updateError } = await client.auth.updateUser({ password })
      if (updateError) throw updateError
      toast.success('Password updated. You’re all set.')
      navigate('/account')
    } catch (cause) {
      setError(cause.message || 'We couldn’t update your password. Request a fresh reset link and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-editorial auth-editorial--small">
        <span className="auth-editorial__mark">TL<span>.</span></span>
        <div><span className="eyebrow">Almost there</span><h1>A new<br /><em>beginning.</em></h1><p>Make it a good one — and easy to remember.</p></div>
        <span className="auth-editorial__foot">TRENDLAMA · DHAKA</span>
      </div>
      <div className="auth-card auth-card--centered">
        <Link className="back-link" to="/"><span>←</span> Back to the shop</Link>
        <div className="auth-icon"><LockKeyhole size={22} /></div>
        <span className="eyebrow">Make it yours</span>
        <h2>Choose a new password.</h2>
        <p className="auth-card__intro">A fresh password will get you back to your account.</p>
        {error && <div className="form-message form-message--error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label className="field"><span>New password</span><span className="field__input"><LockKeyhole size={17} /><input type="password" minLength={6} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></span></label>
          <label className="field"><span>Confirm password</span><span className="field__input"><LockKeyhole size={17} /><input type="password" minLength={6} required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Type it one more time" /></span></label>
          <button className="button button--dark button--full auth-submit" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save new password'} {!submitting && <ArrowRight size={17} />}</button>
        </form>
      </div>
    </section>
  )
}
