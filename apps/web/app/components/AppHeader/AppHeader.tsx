import { HelpCircle, ListMusic, Save, Trash2 } from 'lucide-react'
import pilotSvg from '~/assets/pilot.svg'
import css from './AppHeader.module.css'

interface AppHeaderProps {
  activeStage: string
  playlistCount: number
  isPlaylistDirty: boolean
  isSavingPlaylist: boolean
  onToggleHelp: () => void
  onTogglePlaylist: () => void
  onSavePlaylist: () => void
  onClearPlaylist: () => void
}

export default function AppHeader({
  activeStage,
  playlistCount,
  isPlaylistDirty,
  isSavingPlaylist,
  onToggleHelp,
  onTogglePlaylist,
  onSavePlaylist,
  onClearPlaylist,
}: AppHeaderProps) {
  const hasPlaylist = playlistCount > 0
  const showSavePulse = isPlaylistDirty && !isSavingPlaylist
  const saveTitle = isSavingPlaylist
    ? 'Saving…'
    : isPlaylistDirty
      ? "Save as a new playlist — current changes haven't been persisted yet"
      : 'Playlist is up to date'
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
            <button
              type="button"
              className={`${css.pillButton} ${css.pillButtonSmall} ${css.saveButton} ${showSavePulse ? css.pulse : ''}`}
              onClick={onSavePlaylist}
              disabled={!isPlaylistDirty || isSavingPlaylist}
              title={saveTitle}
            >
              <Save size={14} />
              <span>{isSavingPlaylist ? 'Saving…' : 'Save playlist'}</span>
            </button>
            <button
              type="button"
              className={`${css.pillButton} ${css.pillButtonSmall} ${css.destructiveButton}`}
              onClick={onClearPlaylist}
              title="Clear playlist"
            >
              <Trash2 size={14} />
              <span>Clear playlist</span>
            </button>
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
