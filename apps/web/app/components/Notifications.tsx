import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface Notification {
  id: number
  text: string
  type: string
}

interface NotifyOptions {
  text: string
  type?: string
  duration?: number
}

interface NotificationContextValue {
  notify: (opts: NotifyOptions) => void
}

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
})

export function useNotify() {
  return useContext(NotificationContext).notify
}

let nextId = 0

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const notify = useCallback(
    ({ text, type = 'default', duration = 3000 }: NotifyOptions) => {
      const id = nextId++
      setNotifications((prev) => [...prev, { id, text, type }])
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, duration)
    },
    [],
  )

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px',
          pointerEvents: 'none',
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: n.type === 'error' ? '#b71c1c' : '#2e7d32',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '4px',
              fontSize: '14px',
              maxWidth: '400px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'auto',
            }}
          >
            {n.text}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
