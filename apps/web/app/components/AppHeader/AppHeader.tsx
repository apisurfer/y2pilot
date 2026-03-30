import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { getYtVideoId, getYtUrls } from '~/lib/string'
import pilotSvg from '~/assets/pilot.svg'
import css from './AppHeader.module.css'

interface AppHeaderProps {
  activeStage: string
  onTogglePlaylist: () => void
  onToggleHelp: () => void
  onAddYtUrls: (videoIds: string[]) => void
}

export default function AppHeader({
  activeStage,
  onTogglePlaylist,
  onToggleHelp,
  onAddYtUrls,
}: AppHeaderProps) {
  const [manualUrlInput, setManualUrlInput] = useState('')

  function handleManualUrlChange(value: string) {
    setManualUrlInput(value)
    const ytUrlsFound = getYtUrls(value)
    const videoIds = ytUrlsFound
      .map(getYtVideoId)
      .filter(Boolean) as string[]

    if (videoIds.length) {
      onAddYtUrls(videoIds)
      setManualUrlInput('')
    }
  }

  return (
    <div className={css.appHeader}>
      <a className={css.logo} href="/">
        <img src={pilotSvg} alt="Pilot" /> y2pilot
      </a>
      <div className={css.controls}>
        <input
          value={manualUrlInput}
          autoFocus
          className={css.urlInput}
          type="url"
          placeholder="Paste URL(s)"
          onChange={(e) => handleManualUrlChange(e.target.value)}
          onKeyUp={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
        />
        <button
          className={activeStage === 'playlist' ? css.activeControlsBtn : ''}
          onClick={onTogglePlaylist}
        >
          Playlist
        </button>
        <button
          className={activeStage === 'help' ? css.activeControlsBtn : ''}
          onClick={onToggleHelp}
        >
          <HelpCircle size={28} />
        </button>
      </div>
    </div>
  )
}
