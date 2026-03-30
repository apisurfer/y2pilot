import type { ReactNode } from 'react'
import css from './SharePlaylistModal.module.css'

interface SharePlaylistModalProps {
  children?: ReactNode
  onClose: () => void
}

export default function SharePlaylistModal({
  children,
  onClose,
}: SharePlaylistModalProps) {
  return (
    <div className={css.modalMask} onClick={onClose}>
      <div className={css.modalWrapper}>
        <div className={css.modalContainer} onClick={(e) => e.stopPropagation()}>
          <div className={css.modalHeader}>
            <h3>Share or save playlist</h3>
          </div>

          <div className={css.modalBody}>{children}</div>

          <div className={css.modalFooter}>
            This URL is a snapshot of your current playlist state and is
            permanent. If you decide to reorder, add, or remove videos from your
            playlist just generate a new playlist URL.
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
