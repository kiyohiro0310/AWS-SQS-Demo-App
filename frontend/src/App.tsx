import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Priority = 'low' | 'normal' | 'high'

type JobRecord = {
  id: string
  customerName: string
  customerEmail: string
  priority: Priority
  message: string
  submittedAt: string
  processedAt?: string
}

type QueueSnapshot = {
  configured: boolean
  queueName?: string
  queueUrl?: string
  lastPolledAt?: string
  lastError?: string
  submittedJobs: JobRecord[]
  processedJobs: JobRecord[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const defaultForm = {
  customerName: '',
  customerEmail: '',
  priority: 'normal' as Priority,
  message: '',
}

function App() {
  const [form, setForm] = useState(defaultForm)
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  async function loadQueueSnapshot() {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`)
      if (!response.ok) {
        throw new Error('Failed to load the queue snapshot.')
      }

      const data = (await response.json()) as QueueSnapshot
      setSnapshot(data)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadQueueSnapshot()

    const intervalId = window.setInterval(() => {
      void loadQueueSnapshot()
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(data.message ?? 'Unable to submit the job.')
      }

      setForm(defaultForm)
      setSuccessMessage(data.message ?? 'Job submitted successfully.')
      await loadQueueSnapshot()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unexpected error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">React + NestJS + AWS SQS</p>
        <h2>Support queue demo</h2>
        <p className="hero-copy">
          The React app sends a support request to NestJS, NestJS pushes it into
          SQS, and a background consumer polls the queue and records processed
          messages.
        </p>
        <div className="stack-grid">
          <article>
            <span>Frontend</span>
            <strong>React + Vite</strong>
          </article>
          <article>
            <span>API</span>
            <strong>NestJS</strong>
          </article>
          <article>
            <span>Queue</span>
            <strong>AWS SQS</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Submit Message</p>
              <h2>Create a support job</h2>
            </div>
            <div className={`status-pill ${snapshot?.configured ? 'ok' : 'warn'}`}>
              {snapshot?.configured ? 'SQS configured' : 'SQS not configured'}
            </div>
          </div>

          <form className="job-form" onSubmit={handleSubmit}>
            <label>
              Customer name
              <input
                value={form.customerName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerName: event.target.value,
                  }))
                }
                placeholder="Jane Doe"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerEmail: event.target.value,
                  }))
                }
                placeholder="jane@example.com"
                required
              />
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as Priority,
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>

            <label>
              Issue summary
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                placeholder="Describe the support request..."
                rows={5}
                required
              />
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Send to SQS'}
            </button>
          </form>

          {successMessage ? <p className="feedback success">{successMessage}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Queue Activity</p>
              <h2>Recent message flow</h2>
            </div>
            <span className="poll-text">
              {isLoading
                ? 'Loading...'
                : snapshot?.lastPolledAt
                  ? `Last poll ${new Date(snapshot.lastPolledAt).toLocaleTimeString()}`
                  : 'Waiting for first poll'}
            </span>
          </div>

          {snapshot?.lastError ? (
            <p className="feedback error">{snapshot.lastError}</p>
          ) : null}

          <div className="queue-columns">
            <section>
              <h3>Submitted jobs</h3>
              <QueueList
                items={snapshot?.submittedJobs ?? []}
                emptyMessage="Send a job from the form to see it appear here."
              />
            </section>

            <section>
              <h3>Processed jobs</h3>
              <QueueList
                items={snapshot?.processedJobs ?? []}
                emptyMessage="Once the poller receives and deletes SQS messages, they appear here."
              />
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

function QueueList({
  items,
  emptyMessage,
}: {
  items: JobRecord[]
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <ul className="queue-list">
      {items.map((item) => (
        <li key={`${item.id}-${item.processedAt ?? item.submittedAt}`}>
          <div className="list-row">
            <strong>{item.customerName}</strong>
            <span className={`priority-badge ${item.priority}`}>{item.priority}</span>
          </div>
          <p>{item.message}</p>
          <small>
            {item.customerEmail} · submitted{' '}
            {new Date(item.submittedAt).toLocaleString()}
            {item.processedAt
              ? ` · processed ${new Date(item.processedAt).toLocaleString()}`
              : ''}
          </small>
        </li>
      ))}
    </ul>
  )
}

export default App
