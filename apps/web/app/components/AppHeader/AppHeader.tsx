import { HelpCircle, ListMusic } from 'lucide-react'
import pilotSvg from '~/assets/pilot.svg'
import css from './AppHeader.module.css'

interface AppHeaderProps {
  activeStage: string
  playlistCount: number
  onToggleHelp: () => void
  onTogglePlaylist: () => void
}

export default function AppHeader({
  activeStage,
  playlistCount,
  onToggleHelp,
  onTogglePlaylist,
}: AppHeaderProps) {
  return (
    <div className={css.appHeader}>
      <div className={css.leftGroup}>
        <a className={css.logo} href="/">
          <img src={pilotSvg} alt="Pilot" />
          <span>y2pilot</span>
        </a>
        {playlistCount > 0 && (
          <button
            type="button"
            className={`${css.pillButton} ${activeStage === 'playlist' ? css.active : ''}`}
            onClick={onTogglePlaylist}
          >
            <ListMusic size={18} />
            <span>playlist ({playlistCount})</span>
          </button>
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
