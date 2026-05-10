import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ListMusic,
  SkipBack,
  SkipForward,
  Trash2,
} from 'lucide-react'
import pilotSvg from '~/assets/pilot.svg'
import css from './AppHeader.module.css'

interface AppHeaderProps {
  activeStage: string
  hasPlayback: boolean
  onToggleHelp: () => void
  onTogglePlaylist: () => void
  onPrevious: () => void
  onNext: () => void
  onRemove: () => void
}

export default function AppHeader({
  activeStage,
  hasPlayback,
  onToggleHelp,
  onTogglePlaylist,
  onPrevious,
  onNext,
  onRemove,
}: AppHeaderProps) {
  const [linksOpen, setLinksOpen] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)

  return (
    <div className={css.appHeader}>
      <div className={css.hud}>
        <div className={css.column}>
          <div className={css.headChip}>
            <div className={css.topRow}>
              <a className={css.logo} href="/">
                <img src={pilotSvg} alt="Pilot" />
                <span>y2pilot</span>
              </a>
              <button
                type="button"
                className={css.rightToggle}
                aria-expanded={linksOpen}
                aria-label={linksOpen ? 'Close links' : 'Open links'}
                onClick={() => setLinksOpen((v) => !v)}
              >
                {linksOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>
            {hasPlayback && (
              <button
                type="button"
                className={css.bottomToggle}
                aria-expanded={controlsOpen}
                aria-label={controlsOpen ? 'Close controls' : 'Open controls'}
                onClick={() => setControlsOpen((v) => !v)}
              >
                {controlsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
          {hasPlayback && controlsOpen && (
            <div className={css.controlsMenu}>
              <div className={css.controlGroup}>
                <button
                  type="button"
                  className={css.controlItem}
                  onClick={onPrevious}
                >
                  <SkipBack size={18} />
                  <span>previous</span>
                </button>
                <button
                  type="button"
                  className={css.controlItem}
                  onClick={onNext}
                >
                  <SkipForward size={18} />
                  <span>next</span>
                </button>
              </div>
              <div className={css.controlGroup}>
                <button
                  type="button"
                  className={`${css.controlItem} ${activeStage === 'playlist' ? css.active : ''}`}
                  onClick={onTogglePlaylist}
                >
                  <ListMusic size={18} />
                  <span>playlist</span>
                </button>
              </div>
              <div className={css.controlGroup}>
                <button
                  type="button"
                  className={css.controlItem}
                  onClick={onRemove}
                >
                  <Trash2 size={18} />
                  <span>remove song</span>
                </button>
              </div>
            </div>
          )}
        </div>
        {linksOpen && (
          <div className={css.linksMenu}>
            <button
              type="button"
              className={`${css.linkItem} ${activeStage === 'help' ? css.active : ''}`}
              onClick={onToggleHelp}
            >
              <HelpCircle size={18} />
              <span>help</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
