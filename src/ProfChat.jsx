import { useEffect, useRef, useState } from 'react'
import { PROFESSOR_INFO } from './talk.js'
import { AI_PROFS } from './aiProfs.js'

// Chat window for the AI professor characters. Talks to the FastAPI back end in backend/
// (local only: cd backend && .venv/Scripts/uvicorn main:app --port 8001).
const API_URL = import.meta.env.VITE_PROF_API ?? 'http://localhost:8001'
const MAX_CHARS = 1500 // matches MAX_MESSAGE_CHARS in backend/models.py

const GREETING = {
  zaman: "Yo! Welcome to MGT 409. Ask me anything: AI agents, stats, regression, which classes to take... let's gooo.",
  schott: "Hey hey, welcome to EMBA stats! Stoked you stopped by. Got a long problem for me? Those are my favorite.",
  ...Object.fromEntries(Object.entries(AI_PROFS).map(([slug, p]) => [slug, p.greeting])),
}

export default function ProfChat({ slug, onClose }) {
  const info = PROFESSOR_INFO[slug]
  const [messages, setMessages] = useState([{ role: 'assistant', content: GREETING[slug] ?? 'Hi! What can I help you with?' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  useEffect(() => {
    // braces matter: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    const history = messages.slice(1) // skip the canned greeting
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/professors/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(typeof body?.detail === 'string' ? body.detail : `Server error ${res.status}`)
      setMessages((m) => [...m, { role: 'assistant', content: body.reply }])
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? "Can't reach the professor. Chat runs locally: start the back end on port 8001."
          : err.message,
      )
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="profchat" role="dialog" aria-label={`Chat with ${info.short}`}>
      <header>
        <div>
          <div className="pc-name">{info.short}</div>
          <div className="pc-course">{info.course}</div>
        </div>
        <button className="pc-close" onClick={onClose} aria-label="Close chat">
          Back to walking
        </button>
      </header>
      <div className="pc-disclaimer">AI character inspired by {info.name}, not the real professor. For grades, extensions, or course policies, ask the real professor.</div>
      <div className="pc-log">
        {messages.map((m, i) => (
          <div key={i} className={`pc-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="pc-msg assistant pc-typing">
            <span />
            <span />
            <span />
          </div>
        )}
        {error && <div className="pc-error">{error}</div>}
        <div ref={endRef} />
      </div>
      <form className="pc-input" onSubmit={send}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CHARS}
          placeholder="Ask about AI, stats, classes…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
