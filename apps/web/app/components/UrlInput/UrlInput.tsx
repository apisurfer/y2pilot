import { useState } from 'react'
import { getYtVideoId, getYtUrls } from '~/lib/string'
import css from './UrlInput.module.css'

interface UrlInputProps {
  onAddYtUrls: (videoIds: string[]) => void
  autoFocus?: boolean
  placeholder?: string
  className?: string
}

/**
 * Controlled input that parses YouTube URL(s) out of whatever is typed/pasted
 * and appends the matched videos. As soon as one or more video ids are found
 * the field is cleared, ready for the next paste. Shared by the intro screen
 * and the playlist sidebar so both behave identically.
 */
export default function UrlInput({
  onAddYtUrls,
  autoFocus = false,
  placeholder = 'Paste Youtube URL(s)',
  className,
}: UrlInputProps) {
  const [urlInput, setUrlInput] = useState('')

  function handleUrlChange(value: string) {
    setUrlInput(value)
    const videoIds = getYtUrls(value)
      .map(getYtVideoId)
      .filter(Boolean) as string[]

    if (videoIds.length) {
      onAddYtUrls(videoIds)
      setUrlInput('')
    }
  }

  return (
    <input
      value={urlInput}
      autoFocus={autoFocus}
      className={`${css.urlInput} ${className || ''}`}
      type="url"
      placeholder={placeholder}
      onChange={(e) => handleUrlChange(e.target.value)}
      // Keep the page-level keyboard shortcuts and paste handler from firing
      // while the user is typing in the field.
      onKeyUp={(e) => e.stopPropagation()}
      onPaste={(e) => e.stopPropagation()}
    />
  )
}
