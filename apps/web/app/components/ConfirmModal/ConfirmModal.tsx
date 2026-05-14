import { useEffect, type ReactNode } from 'react'
import css from './ConfirmModal.module.css'

interface ConfirmModalProps {
  children?: ReactNode
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmModal({
  children,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        onClose()
      }
    }
    // Capture phase so we run before any bubble-phase document handlers
    // (e.g. the app-level Escape shortcut) and can suppress them.
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
            <h3>Confirm action</h3>
          </div>

          <div className={css.modalBody}>
            {children || 'Please confirm your action'}
          </div>

          <div className={css.modalFooter}>
            <button className={css.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={css.confirmButton} onClick={onConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
