import { HelpCircle, ListMusic, Save, Copy, Check } from 'lucide-react'
import pilotSvg from '~/assets/pilot.svg'
import css from './AppHeader.module.css'

interface AppHeaderProps {
  activeStage: string
  playlistCount: number
  isOwner: boolean
  isPlaylistDirty: boolean
  isSavingPlaylist: boolean
  onToggleHelp: () => void
  onTogglePlaylist: () => void
  onSavePlaylist: () => void
  onCopyPlaylist: () => void
}

export default function AppHeader({
  activeStage,
  playlistCount,
  isOwner,
  isPlaylistDirty,
  isSavingPlaylist,
  onToggleHelp,
  onTogglePlaylist,
  onSavePlaylist,
  onCopyPlaylist,
}: AppHeaderProps) {
  const hasPlaylist = playlistCount > 0
  // Owners auto-save, so the pill is just a status indicator (clicking forces a
  // save now). It pulses while there are changes still waiting to be persisted.
  const showSavePulse = isPlaylistDirty && !isSavingPlaylist
  const saveLabel = isSavingPlaylist
    ? 'Saving…'
    : isPlaylistDirty
      ? 'Save now'
      : 'Saved'
  const saveTitle = isSavingPlaylist
    ? 'Saving…'
    : isPlaylistDirty
      ? 'You have unsaved changes — they auto-save shortly. Click to save now.'
      : 'All changes saved'
  const SaveStatusIcon = isPlaylistDirty || isSavingPlaylist ? Save : Check
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
          <div className={css.playlistGroup}>
            <button
              type="button"
              className={`${css.pillButton} ${activeStage === 'playlist' ? css.active : ''}`}
              onClick={onTogglePlaylist}
            >
              <ListMusic size={18} />
              <span>
                {playlistCount} video{playlistCount === 1 ? '' : 's'}
              </span>
            </button>
            {isOwner ? (
              <button
                type="button"
                className={`${css.pillButton} ${css.pillButtonSmall} ${css.saveButton} ${showSavePulse ? css.pulse : ''}`}
                onClick={onSavePlaylist}
                disabled={!isPlaylistDirty || isSavingPlaylist}
                title={saveTitle}
              >
                <SaveStatusIcon size={14} />
                <span>{saveLabel}</span>
              </button>
            ) : (
              <button
                type="button"
                className={`${css.pillButton} ${css.pillButtonSmall} ${css.saveButton} ${showSavePulse ? css.pulse : ''}`}
                onClick={onCopyPlaylist}
                disabled={isSavingPlaylist}
                title="This playlist belongs to someone else. Make your own editable copy."
              >
                <Copy size={14} />
                <span>{isSavingPlaylist ? 'Copying…' : 'Make a copy'}</span>
              </button>
            )}
          </div>
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
