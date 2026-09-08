import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Plus, X } from '@/icons'
import { useAccount, professionFor } from '@/context/AccountContext'
import { supportConfigFor } from '@/data/support/supportFixtures'

/**
 * Live Chat widget (Elite "Elite Chat" screens). A floating, bottom-right chat
 * panel — NOT a full-screen modal — with its own blue header. Three steps:
 *   1. `topics`  — "What would you like to chat about?" radio list + Chat Now.
 *   2. `chat`    — a simulated agent conversation (scripted system/agent
 *                  messages appear on a short timer); the learner can type +
 *                  send messages (appended as their own bubbles).
 *   3. End-chat confirm — the header X while chatting dims the body and asks
 *                  "Are you sure you want to end the chat?" (Cancel / End Chat).
 *
 * Everything is a demo stub — no real chat backend. The parent mounts this
 * only while chat is open (so its state initializes fresh each open, with no
 * reset effect); `onClose` unmounts it.
 */
type ChatMessage = {
  id: number
  from: 'system' | 'agent' | 'user'
  /** Sender initials for the avatar (system → "SY", agent → "AR"). */
  who?: string
  text: string
  time: string
  /** A centered, avatar-less status line ("Thank you for contacting us."). */
  status?: boolean
}

const AGENT_NAME = 'Ara'

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function LiveChatWidget({ onClose }: { onClose: () => void }) {
  const { brand } = useAccount()
  const { chatName, chatTopics } = supportConfigFor(brand)
  const brandName = professionFor(brand).brandFullName

  const [step, setStep] = useState<'topics' | 'chat'>('topics')
  const [topic, setTopic] = useState(chatTopics[0] ?? '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const nextId = useRef(0)
  const timers = useRef<number[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Clear any pending scripted-message timers on unmount.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const push = (m: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...m, id: nextId.current++ }])

  // "Chat Now" → move to the chat step + play the scripted agent-connect
  // sequence on a short timer (demo simulation).
  const startChat = () => {
    setStep('chat')
    push({ from: 'system', text: 'Thank you for contacting us.', time: nowLabel(), status: true })
    push({
      from: 'system',
      who: 'SY',
      text: 'Please wait as we connect you to our next available agent.',
      time: nowLabel(),
    })
    const t1 = window.setTimeout(() => {
      push({ from: 'system', text: `${AGENT_NAME} has joined the chat`, time: nowLabel(), status: true })
    }, 1400)
    const t2 = window.setTimeout(() => {
      push({ from: 'agent', who: 'AR', text: `Thank you for contacting ${brandName}.`, time: nowLabel() })
    }, 2200)
    timers.current.push(t1, t2)
  }

  const sendDraft = () => {
    const text = draft.trim()
    if (!text) return
    push({ from: 'user', text, time: nowLabel() })
    setDraft('')
  }

  // Header X: while chatting, confirm before ending; on the topics step, close
  // straight away.
  const handleHeaderClose = () => {
    if (step === 'chat') setConfirmEnd(true)
    else onClose()
  }

  return createPortal(
    <div className="cre-chat-widget" style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={headerTitleStyle}>{chatName}</span>
        <button type="button" aria-label="Close chat" onClick={handleHeaderClose} style={headerCloseStyle}>
          <X size={18} aria-hidden />
        </button>
      </div>

      {/* Body */}
      {step === 'topics' ? (
        <div style={topicsBodyStyle}>
          <p style={topicsPromptStyle}>What would you like to chat about?</p>
          <div role="radiogroup" aria-label="Chat topic" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {chatTopics.map((t) => (
              <label key={t} style={topicRowStyle}>
                <input
                  type="radio"
                  name="chat-topic"
                  checked={topic === t}
                  onChange={() => setTopic(t)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-action)', cursor: 'pointer' }}
                />
                <span style={topicLabelStyle}>{t}</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button type="button" onClick={startChat} style={chatNowBtnStyle}>
              Chat Now
            </button>
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} style={chatScrollStyle}>
            {messages.map((m) =>
              m.status ? (
                <p key={m.id} style={statusLineStyle}>
                  {m.text}
                </p>
              ) : (
                <MessageRow key={m.id} message={m} />
              ),
            )}
          </div>
          {/* Composer */}
          <div style={composerStyle}>
            <button type="button" aria-label="Add attachment" style={composerIconBtnStyle}>
              <Plus size={16} aria-hidden />
            </button>
            <input
              aria-label="Type a message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendDraft()
              }}
              placeholder="Type a message..."
              style={composerInputStyle}
            />
            <button type="button" aria-label="Send message" onClick={sendDraft} style={sendBtnStyle}>
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
        </>
      )}

      {/* End-chat confirmation overlay */}
      {confirmEnd && (
        <div style={confirmOverlayStyle}>
          <div style={confirmCardStyle}>
            <h3 style={confirmTitleStyle}>End Chat</h3>
            <p style={confirmBodyStyle}>Are you sure you want to end the chat?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <button type="button" onClick={() => setConfirmEnd(false)} style={confirmCancelBtnStyle}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmEnd(false)
                  onClose()
                }}
                style={confirmEndBtnStyle}
              >
                End Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}

/** One message bubble with a leading avatar + a trailing timestamp. User
 *  messages align right (no avatar); system/agent messages align left. */
function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.from === 'user'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: '85%' }}>
        {!isUser && (
          <span aria-hidden style={avatarStyle}>
            {message.who}
          </span>
        )}
        <div style={isUser ? userBubbleStyle : bubbleStyle}>{message.text}</div>
      </div>
      <span style={{ ...metaStyle, textAlign: isUser ? 'right' : 'left', paddingLeft: isUser ? 0 : 40 }}>
        {!isUser && message.who === 'AR' ? `${AGENT_NAME} · ` : ''}
        {!isUser && message.who === 'SY' ? 'SYSTEM · ' : ''}
        {message.time}
      </span>
    </div>
  )
}

/* ─── styles ─────────────────────────────────────────────────────────── */

const panelStyle: CSSProperties = {
  position: 'fixed',
  right: 24,
  bottom: 24,
  zIndex: 200,
  width: 400,
  maxWidth: 'calc(100vw - 48px)',
  height: 620,
  maxHeight: 'calc(100vh - 48px)',
  background: 'var(--color-surface-card)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 12px 32px rgb(0 0 0 / 0.28)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  height: 56,
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  flexShrink: 0,
}

const headerTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '24px',
}

const headerCloseStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
}

const topicsBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
}

const topicsPromptStyle: CSSProperties = {
  margin: '0 0 18px',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const topicRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
}

const topicLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const chatNowBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 150,
  height: 48,
  padding: '0 24px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 18,
  cursor: 'pointer',
}

const chatScrollStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  background: 'var(--color-surface-page)',
}

const statusLineStyle: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
}

const avatarStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-700)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
}

const bubbleStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
  boxShadow: '0 1px 2px rgb(0 0 0 / 0.08)',
}

const userBubbleStyle: CSSProperties = {
  ...bubbleStyle,
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  boxShadow: 'none',
}

const metaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

const composerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  borderTop: '1px solid var(--color-border-subtle)',
  flexShrink: 0,
}

const composerIconBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-700)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  cursor: 'pointer',
}

const composerInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 40,
  padding: '0 12px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  color: 'var(--color-text-primary)',
  outline: 'none',
}

const sendBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  cursor: 'pointer',
}

const confirmOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgb(0 0 0 / 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
}

const confirmCardStyle: CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-card)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px 20px',
  textAlign: 'center',
  boxShadow: 'var(--shadow-modal, 0 8px 24px rgb(0 0 0 / 0.2))',
}

const confirmTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 22,
  color: 'var(--color-text-primary)',
}

const confirmBodyStyle: CSSProperties = {
  margin: '0 0 20px',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const confirmCancelBtnStyle: CSSProperties = {
  minWidth: 110,
  height: 44,
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--color-cta-500)',
  border: '1px solid var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
}

const confirmEndBtnStyle: CSSProperties = {
  minWidth: 110,
  height: 44,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  border: '1px solid var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
}
