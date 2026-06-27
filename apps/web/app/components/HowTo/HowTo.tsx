import UrlInput from '~/components/UrlInput/UrlInput'
import lesgo from '~/assets/lesgo.png'
import css from './HowTo.module.css'

interface HowToProps {
  onAddYtUrls: (videoIds: string[]) => void
}

export default function HowTo({ onAddYtUrls }: HowToProps) {
  return (
    <div className={css.howTo}>
      <div className={css.howToContent}>
        <div className={css.pitch}>
          <h1>Instantly shareable YouTube playlists</h1>
          <ul>
            <li>no account required</li>
            <li>no interruptions, non-stop play</li>
            <li>create, share, play, forget about it</li>
            <li>incognito mode supported</li>
            <li>free 😎</li>
          </ul>
        </div>
        <div className={css.initInstructions}>
          <UrlInput autoFocus onAddYtUrls={onAddYtUrls} className={css.urlInput} />
          <p>
            Drag and drop, or paste a Youtube:
          </p>
          <ul>
            <li>link</li>
            <li>bookmark</li>
            <li>video thumbnail</li>
          </ul>
          <p>
            Try it out with following example:
            <br />
            1. grab the link
            <br />
            2. drop it anywhere on this page.
          </p>
          <div className={css.ytCard}>
            <img src={lesgo} alt="" />
            <a
              className={css.ytThumb}
              href="https://www.youtube.com/watch?v=1c4DFNy2t9E&list=RD1c4DFNy2t9E"
            >
              {' '}
            </a>
            <a
              className={css.ytTitle}
              href="https://www.youtube.com/watch?v=1c4DFNy2t9E&list=RD1c4DFNy2t9E"
            >
              
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
