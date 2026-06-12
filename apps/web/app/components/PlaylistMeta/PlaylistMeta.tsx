import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Smile, X } from 'lucide-react'
import css from './PlaylistMeta.module.css'

const EmojiPickerLazy = lazy(() => import('./EmojiPickerLazy'))

interface PlaylistMetaProps {
  name: string
  emoji: string
  readOnly?: boolean
  onChangeName: (name: string) => void
  onChangeEmoji: (emoji: string) => void
}

export default function PlaylistMeta({
  name,
  emoji,
  readOnly = false,
  onChangeName,
  onChangeEmoji,
}: PlaylistMetaProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close the picker on outside click or Escape.
  useEffect(() => {
    if (!pickerOpen) return

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen])

  // Read-only (foreign) playlists: show the title/emoji if set, nothing if both
  // are empty.
  if (readOnly) {
    if (!name && !emoji) return null
    return (
      <div className={css.readOnly}>
        {emoji && <span className={css.readOnlyEmoji}>{emoji}</span>}
        {name && <span className={css.readOnlyName}>{name}</span>}
      </div>
    )
  }

  return (
    <div className={css.meta} ref={containerRef}>
      <div className={css.emojiSlot}>
        <button
          type="button"
          className={css.emojiButton}
          onClick={() => setPickerOpen((open) => !open)}
          title={emoji ? 'Pick an emoji' : 'Add an emoji'}
          aria-label={emoji ? 'Pick an emoji' : 'Add an emoji'}
        >
          {emoji ? (
            <span className={css.emojiGlyph}>{emoji}</span>
          ) : (
            <Smile size={20} />
          )}
        </button>

        {emoji && (
          <button
            type="button"
            className={css.clearOverlay}
            onClick={() => {
              onChangeEmoji('')
              setPickerOpen(false)
            }}
            title="Remove emoji"
            aria-label="Remove emoji"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <input
        type="text"
        className={css.titleInput}
        value={name}
        onChange={(e) => onChangeName(e.target.value)}
        placeholder="Set playlist title..."
        maxLength={120}
        aria-label="Playlist title"
      />

      {pickerOpen && (
        <div className={css.picker}>
          <Suspense
            fallback={<div className={css.pickerLoading}>Loading…</div>}
          >
            <EmojiPickerLazy
              onPick={(picked) => {
                onChangeEmoji(picked)
                setPickerOpen(false)
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
