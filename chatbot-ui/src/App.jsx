import { useState } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || loading) return

    const nextMessages = [...messages, { role: 'user', content: trimmedInput }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://legendary-tribble-wr7r76p4g4rxf569r-3001.app.github.dev/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: nextMessages }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Request failed')
      }

      if (data.type === 'image') {
        setMessages((current) => [
          ...current,
          { role: 'assistant', type: 'image', image: data.image },
        ])
        return
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', type: 'text', content: data.reply },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          type: 'text',
          content: error.message || 'Sorry, something went wrong.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <h1>Chat</h1>
      </div>

      <div className="messages">
        {messages.length === 0 && !loading && (
          <div className="empty-state">Ask a question to get started.</div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <span className="label">{message.role === 'user' ? 'You' : 'Assistant'}</span>

            {message.role === 'user' ? (
              <p>{message.content}</p>
            ) : message.type === 'image' ? (
              <img src={message.image} alt="Generated response" className="assistant-image" />
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        ))}

        {loading && (
          <div className="message assistant loading">
            <span className="label">Assistant</span>
            <p>Thinking...</p>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default App
