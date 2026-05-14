import { useEffect, type ReactNode } from 'react'
import css from './SharePlaylistModal.module.css'

interface SharePlaylistModalProps {
  children?: ReactNode
  onClose: () => void
}

export default function SharePlaylistModal({
  children,
  onClose,
}: SharePlaylistModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('keyup', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('keyup', onKey, true)
    }
  }, [onClose])

  return (
    <div className={css.modalMask} onClick={onClose}>
      <div className={css.modalWrapper}>
        <div
          className={css.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={css.modalHeader}>
            <h3>Share or save playlist</h3>
          </div>

          <div className={css.modalBody}>{children}</div>

          <div className={css.modalFooter}>
            <p className={css.note}>
              This URL is a snapshot of your current playlist state and is
              permanent.
            </p>
            <p className={css.note}>
              Wish to reorder, add, or remove videos?
              <br />
              Just generate a new playlist link!
            </p>
            <button className={css.closeButton} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
