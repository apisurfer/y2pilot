import type { ReactNode } from 'react'
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
  return (
    <div className={css.modalMask} onClick={onClose}>
      <div className={css.modalWrapper}>
        <div className={css.modalContainer} onClick={(e) => e.stopPropagation()}>
          <div className={css.modalHeader}>
            <h3>Confirm action</h3>
          </div>

          <div className={css.modalBody}>
            {children || 'Please confirm your action'}
          </div>

          <div className={css.modalFooter}>
            <button className={css.modalButtonLeft} onClick={onClose}>
              Close
            </button>
            <button className={css.modalButtonRight} onClick={onConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
