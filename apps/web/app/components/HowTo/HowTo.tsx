import { useState } from 'react'
import { getYtVideoId, getYtUrls } from '~/lib/string'
import ytCardCutout from '~/assets/yt-card-cutout.png'
import css from './HowTo.module.css'

interface HowToProps {
  onAddYtUrls: (videoIds: string[]) => void
}

export default function HowTo({ onAddYtUrls }: HowToProps) {
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
    <div className={css.howTo}>
      <div className={css.howToContent}>
        <div className={css.pitch}>
          <h1>Youtube playlists on the fly</h1>
          <ul>
            <li>no account required</li>
            <li>no interruptions, non-stop play</li>
            <li>create, share, play, forget about it</li>
            <li>incognito mode supported</li>
            <li>free 😎</li>
          </ul>
        </div>
        <div className={css.initInstructions}>
          <input
            value={urlInput}
            autoFocus
            className={css.urlInput}
            type="url"
            placeholder="Paste Youtube URL(s)"
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyUp={(e) => e.stopPropagation()}
            onPaste={(e) => e.stopPropagation()}
          />
          <p>
            Drag and drop, or paste a Youtube:
          </p>
          <ul>
            <li>link</li>
            <li>bookmark</li>
            <li>video thumbnail</li>
          </ul>
          <p>
            Try it out with example links, grab the link and drop it anywhere on
            this page.
          </p>
          <p>
            <a
              className={css.testLink}
              href="https://www.youtube.com/watch?v=vcsSc2iksC0"
            >
              https://www.youtube.com/watch?v=vcsSc2iksC0
            </a>
          </p>
          <div className={css.ytCard}>
            <a
              className={css.ytThumb}
              href="https://i.ytimg.com/vi/vcsSc2iksC0/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLD1W-wiV9udy5UrSMF4K9sG7C9BUw"
            >
              {' '}
            </a>
            <div className={css.ytInfo}>
              <a href="https://www.youtube.com/watch?v=vcsSc2iksC0">
                Life in a Day 2020 | Official Documentary
              </a>
              <img src={ytCardCutout} alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
