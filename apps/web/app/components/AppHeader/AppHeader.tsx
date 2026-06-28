import { useEffect, useState } from 'react'
import { HelpCircle, ListMusic, Copy, Check, Loader2 } from 'lucide-react'
import pilotSvg from '~/assets/pilot.svg'
import css from './AppHeader.module.css'

interface AppHeaderProps {
  activeStage: string
  playlistCount: number
  playlistName: string
  isOwner: boolean
  isSavingPlaylist: boolean
  onToggleHelp: () => void
  onTogglePlaylist: () => void
  onCopyPlaylist: () => void
}

export default function AppHeader({
  activeStage,
  playlistCount,
  playlistName,
  isOwner,
  isSavingPlaylist,
  onToggleHelp,
  onTogglePlaylist,
  onCopyPlaylist,
}: AppHeaderProps) {
  const hasPlaylist = playlistCount > 0
  const trimmedName = playlistName.trim()

  // The fork action means two different things depending on ownership: owners
  // branch their playlist into a separate editable version; viewers of someone
  // else's read-only playlist make their own editable copy.
  const forkLabel = isOwner ? 'Create a new version' : 'Make your own copy'
  const forkTitle = isOwner
    ? 'Branch these videos into a separate playlist that opens in a new tab'
    : 'Create your own editable copy of this playlist'

  // Auto-save is silent; this drives a transient status indicator on the side:
  // "Saving…" while a save is in flight, then a green "Saved" that fades out a
  // few seconds after the save settles.
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  )

  useEffect(() => {
    if (isSavingPlaylist) {
      setSaveStatus('saving')
      return
    }
    setSaveStatus((prev) => (prev === 'saving' ? 'saved' : prev))
  }, [isSavingPlaylist])

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const handle = setTimeout(() => setSaveStatus('idle'), 2500)
    return () => clearTimeout(handle)
  }, [saveStatus])

  return (
    <div className={css.appHeader}>
      <div className={css.leftGroup}>
        {/* Open in a new tab when a playlist is loaded so a click doesn't
            wipe out the current (non-persisted) playlist via refresh. */}
        <a
          className={css.logo}
          href="/"
          target={hasPlaylist ? '_blank' : undefined}
          rel={hasPlaylist ? 'noopener noreferrer' : undefined}
        >
          <img src={pilotSvg} alt="Pilot" />
          <span>y2pilot</span>
        </a>
        {hasPlaylist && (
          <>
            <div className={css.playlistGroup}>
              <button
                type="button"
                className={`${css.pillButton} ${activeStage === 'playlist' ? css.active : ''}`}
                onClick={onTogglePlaylist}
              >
                <ListMusic size={18} />
                <span>
                  {trimmedName
                    ? `${trimmedName} (${playlistCount})`
                    : `${playlistCount} video${playlistCount === 1 ? '' : 's'}`}
                </span>
              </button>
            </div>
            <button
              type="button"
              className={`${css.pillButton} ${css.pillButtonSmall} ${css.forkButton}`}
              onClick={onCopyPlaylist}
              disabled={isSavingPlaylist}
              title={forkTitle}
            >
              <Copy size={14} />
              <span>{forkLabel}</span>
            </button>
            <div
              className={`${css.saveStatus} ${
                saveStatus === 'idle' ? '' : css.saveStatusVisible
              } ${saveStatus === 'saving' ? css.saveStatusSaving : css.saveStatusSaved}`}
              aria-live="polite"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 size={14} className={css.spin} />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Saved</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <div className={css.rightGroup}>
        <button
          type="button"
          className={`${css.pillButton} ${activeStage === 'help' ? css.active : ''}`}
          onClick={onToggleHelp}
        >
          <HelpCircle size={18} />
          <span>help</span>
        </button>
      </div>
    </div>
  )
}
