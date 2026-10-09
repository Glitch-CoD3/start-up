import { MessageCircle, Send } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminCustomerQueries, replyToCustomerQuery } from '../api'

function formatQueryDate(value) {
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function CustomerQueriesPage() {
  const [queries, setQueries] = useState([])
  const [replies, setReplies] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      setQueries(await getAdminCustomerQueries())
    } catch (cause) {
      console.error('Could not load customer queries for admin.', cause)
      setError(cause.message || 'Customer queries could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    getAdminCustomerQueries()
      .then((data) => {
        if (active) setQueries(data)
      })
      .catch((cause) => {
        console.error('Could not load customer queries for admin.', cause)
        if (active) setError(cause.message || 'Customer queries could not be loaded.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const reply = async (event, queryId) => {
    event.preventDefault()
    const message = replies[queryId] ?? ''
    setSavingId(queryId)
    setError('')
    try {
      await replyToCustomerQuery(queryId, message)
      setReplies((current) => ({ ...current, [queryId]: '' }))
      await refresh()
      toast.success('Reply sent to the customer.')
    } catch (cause) {
      console.error('Could not send customer query reply.', cause)
      setError(cause.message || 'Reply could not be sent.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__heading">
        <div><span className="eyebrow">Read and reply to customer messages</span><h1>Customer queries</h1></div>
        {!loading && <span className="admin-count">{queries.length} total</span>}
      </header>
      <p className="admin-message customer-query-retention">Queries and replies are automatically removed 10 days after the customer submits the query.</p>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? <p className="admin-message">Loading customer queries…</p> : queries.length ? (
        <div className="admin-query-list">
          {queries.map((query) => (
            <article className="admin-query-card" key={query.id}>
              <header className="admin-query-card__heading">
                <div>
                  <span className="eyebrow">{query.customer_name} · {query.customer_email || 'No email'}</span>
                  <h2>{query.subject}</h2>
                  <time dateTime={query.created_at}>{formatQueryDate(query.created_at)}</time>
                </div>
                <span className={`contact-query-status contact-query-status--${query.status}`}>{query.status === 'replied' ? 'Replied' : 'Open'}</span>
              </header>
              <div className="contact-query-messages">
                {query.messages.map((message) => (
                  <div className={`contact-query-message${message.sender_role === 'admin' ? ' contact-query-message--reply' : ''}`} key={message.id}>
                    <div className="contact-query-message__meta">
                      <strong>{message.sender_role === 'admin' ? 'Store support' : query.customer_name}</strong>
                      <time dateTime={message.created_at}>{formatQueryDate(message.created_at)}</time>
                    </div>
                    <p>{message.message}</p>
                  </div>
                ))}
              </div>
              <form className="admin-query-reply" onSubmit={(event) => reply(event, query.id)}>
                <label className="admin-field">
                  <span>Reply to customer</span>
                  <textarea
                    required
                    maxLength="5000"
                    rows="3"
                    value={replies[query.id] ?? ''}
                    onChange={(event) => setReplies((current) => ({ ...current, [query.id]: event.target.value }))}
                    placeholder="Write a helpful reply…"
                  />
                </label>
                <button className="admin-button" type="submit" disabled={savingId === query.id}>
                  <Send size={15} /> {savingId === query.id ? 'Sending…' : 'Send reply'}
                </button>
              </form>
              <small className="contact-query-expiry"><MessageCircle size={13} /> Auto-deletes 10 days after submission</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-media-empty"><MessageCircle size={21} /><span>No customer queries yet.</span></div>
      )}
    </div>
  )
}
