import { MessageCircle, Send } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getCustomerQueries, submitCustomerQuery } from '../api'

function formatQueryDate(value) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function ContactPage() {
  const [queries, setQueries] = useState([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      setQueries(await getCustomerQueries())
    } catch (cause) {
      console.error('Could not load customer queries.', cause)
      setError(cause.message || 'Your queries could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getCustomerQueries()
      .then((data) => {
        if (active) setQueries(data)
      })
      .catch((cause) => {
        console.error('Could not load customer queries.', cause)
        if (active) setError(cause.message || 'Your queries could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await submitCustomerQuery(subject, message)
      setSubject('')
      setMessage('')
      await refresh()
      toast.success('Your query has been sent.')
    } catch (cause) {
      console.error('Could not submit customer query.', cause)
      setError(cause.message || 'Your query could not be submitted.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="contact-page">
      <header className="contact-page__heading">
        <span className="eyebrow">We’re here to help</span>
        <h1>Contact us<span>.</span></h1>
        <p>Send us a message and check this page for our reply. Queries are automatically removed 10 days after submission.</p>
      </header>

      {error && <div className="notice notice--error" role="alert">{error}</div>}
      <form className="contact-query-form" onSubmit={submit}>
        <label className="admin-field">
          <span>Subject</span>
          <input required maxLength="160" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What can we help with?" />
        </label>
        <label className="admin-field">
          <span>Your message</span>
          <textarea required maxLength="5000" rows="5" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us how we can help…" />
        </label>
        <div className="contact-query-form__actions">
          <span>{message.length}/5000</span>
          <button className="button button--dark" type="submit" disabled={submitting}>
            <Send size={16} /> {submitting ? 'Sending…' : 'Send query'}
          </button>
        </div>
      </form>

      <section className="contact-history">
        <div className="order-history__heading">
          <div><span className="eyebrow">Your support history</span><h2>Previous queries</h2></div>
          {!loading && <span>{queries.length} {queries.length === 1 ? 'query' : 'queries'}</span>}
        </div>
        {loading ? <p className="order-history__message">Loading your queries…</p> : queries.length ? (
          <div className="contact-query-list">
            {queries.map((query) => (
              <article className="contact-query-card" key={query.id}>
                <header className="contact-query-card__heading">
                  <div><h3>{query.subject}</h3><time dateTime={query.created_at}>{formatQueryDate(query.created_at)}</time></div>
                  <span className={`contact-query-status contact-query-status--${query.status}`}>{query.status === 'replied' ? 'Replied' : 'Awaiting reply'}</span>
                </header>
                <div className="contact-query-messages">
                  {query.messages.map((entry) => (
                    <div className={`contact-query-message${entry.sender_role === 'admin' ? ' contact-query-message--reply' : ''}`} key={entry.id}>
                      <div className="contact-query-message__meta">
                        <strong>{entry.sender_role === 'admin' ? 'Store support' : 'You'}</strong>
                        <time dateTime={entry.created_at}>{formatQueryDate(entry.created_at)}</time>
                      </div>
                      <p>{entry.message}</p>
                    </div>
                  ))}
                </div>
                <small className="contact-query-expiry"><MessageCircle size={13} /> This query and its replies are removed 10 days after it was sent.</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="order-history__empty"><p>You haven’t sent us a query yet.</p></div>
        )}
      </section>
    </section>
  )
}
