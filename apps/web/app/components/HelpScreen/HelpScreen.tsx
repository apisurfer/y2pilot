import css from './HelpScreen.module.css'

export default function HelpScreen() {
  return (
    <div className={css.helpScreen}>
      <div className={css.helpScreenContent}>
        <div className={css.helpMain}>
          <h2>Why y2pilot.com ?</h2>
          <p>
            YouTube is ideal for watching one video at a time, but awkward for
            disposable playlists, looping in order, or uninterrupted
            back-to-back playback—especially when you already have a pile of
            links and just want to jump right in. y2pilot.com exists for
            exactly that.
          </p>

          <h2>Best use cases</h2>
          <ul>
            <li>
              <strong>no new apps or accounts</strong> - just instantly
              shareable playlists for the moment; queue what fits, play it
              through, and drop it when you are done.
            </li>
            <li>
              <strong>watch multiple videos in a row</strong> - Run them
              back-to-back or lock the whole list into an endless loop with no
              interruptions—built for ambient listening, demos, and any screen
              that must keep playing.
            </li>
            <li>
              <strong>private gatherings</strong> - guests add videos anytime;
              the queue loops on its own. No designated DJ.
            </li>
          </ul>

          <p>
            y2pilot.com is designed and developed by{' '}
            <a target="_blank" rel="noreferrer" href="https://apisurf.dev">
              apisurf.dev
            </a>
          </p>
        </div>

        <aside className={css.helpShortcuts}>
          <h2>Keyboard Shortcuts</h2>
          <p>
            <span className={css.shortcutExplanation}>
              Shuffle playlist &mdash;{' '}
              <strong className={css.emphasize}>shift + s</strong>
            </span>
            <span className={css.shortcutExplanation}>
              Toggle playlist &mdash;{' '}
              <strong className={css.emphasize}>shift + p</strong>
            </span>
            <span className={css.shortcutExplanation}>
              Toggle help screen &mdash;{' '}
              <strong className={css.emphasize}>?</strong>
            </span>
            <span className={css.shortcutExplanation}>
              Close overlay screens &mdash;{' '}
              <strong className={css.emphasize}>ESC</strong>
            </span>
            <span className={css.shortcutExplanation}>
              Previous video &mdash;{' '}
              <strong className={css.emphasize}>shift + left arrow</strong>
            </span>
            <span className={css.shortcutExplanation}>
              Next video &mdash;{' '}
              <strong className={css.emphasize}>shift + right arrow</strong>
            </span>
            <span className={css.shortcutExplanation}>
              Skip video &mdash;{' '}
              <strong className={css.emphasize}>shift + 1, 2, 3</strong>
            </span>
          </p>
        </aside>
      </div>
    </div>
  )
}
