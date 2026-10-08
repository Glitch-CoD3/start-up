import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../../app/providers'
import { requireSupabase } from '../../../lib/supabase'

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { user } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setIsError(false)
    try {
      const client = await requireSupabase()
      if (isSignup) {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), phone_number: phone.trim() } },
        })
        if (error) throw error
        if (data.session) {
          toast.success('Your account is ready. Welcome in!')
          navigate('/')
        } else {
          setMessage('One last step — check your inbox to confirm your email address.')
        }
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        toast.success('Welcome back.')
        navigate('/')
      }
    } catch (cause) {
      setIsError(true)
      setMessage(cause.message || 'We couldn’t complete that request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-editorial">
        <span className="auth-editorial__mark">TL<span>.</span></span>
        <div>
          <span className="eyebrow">Good to have you here</span>
          <h1>{isSignup ? <>A little more<br /><em>you.</em></> : <>A familiar<br /><em>favorite.</em></>}</h1>
          <p>{isSignup ? 'Make a little space for the things you love wearing.' : 'Your everyday edit is right where you left it.'}</p>
        </div>
        <span className="auth-editorial__foot">TRENDLAMA · DHAKA</span>
      </div>
      <div className="auth-card">
        <Link className="back-link" to="/"><ArrowLeft size={15} /> Back to the good stuff</Link>
        <span className="eyebrow">{isSignup ? 'A new beginning' : 'Your account'}</span>
        <h2>{isSignup ? 'Create your account' : 'Welcome back.'}</h2>
        <p className="auth-card__intro">{isSignup ? 'A few details, then you’re in.' : 'Sign in to pick up where you left off.'}</p>
        {message && <div className={`form-message${isError ? ' form-message--error' : ''}`} role={isError ? 'alert' : 'status'}>{message}</div>}
        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <>
              <label className="field">
                <span>Your name</span>
                <span className="field__input"><UserRound size={17} /><input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="What should we call you?" /></span>
              </label>
              <label className="field">
                <span>Phone number <small>Optional</small></span>
                <span className="field__input"><span className="field__prefix">+880</span><input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="1XXXXXXXXX" /></span>
              </label>
            </>
          )}
          <label className="field">
            <span>Email address</span>
            <span className="field__input"><Mail size={17} /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span>
          </label>
          <label className="field">
            <span>Password</span>
            <span className="field__input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /><button className="field__reveal" type="button" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
          </label>
          {!isSignup && <Link className="auth-forgot" to="/forgot-password">Forgot your password?</Link>}
          <button className="button button--dark button--full auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Just a moment…' : isSignup ? 'Create my account' : 'Sign in'}
            {!submitting && <ArrowRight size={17} />}
          </button>
        </form>
        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to Trendlama?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link>
        </p>
        <div className="auth-promise"><Sparkles size={15} /> A good wardrobe begins with pieces you love.</div>
      </div>
    </section>
  )
}
