import css from './HelpScreen.module.css'

export default function HelpScreen() {
  return (
    <div className={css.helpScreen}>
      <div className={css.helpScreenContent}>
        <h2>Why y2pilot.com ?</h2>
        <p>
          YouTube is the most universal video library in the world. Visit a
          website, chose video and start watching. It's as easy as that, and can
          be done from almost any device. But, what if you want to quickly create
          a playlist for the moment and forget about it once you're finished
          watching. What if you want to make a playlist loop indefinitely, choose
          the exact videos, and make them play without interruptions?
          <br />
          <br />
          YouTube isn't very practical for those purposes, especially if you
          already have a bunch of YouTube links stored somewhere and you want to
          easily quickly make a playlist out of them. This was exactly the
          problem I had, before I decided to solve it with y2pilot.com
        </p>

        <h2>Best use cases</h2>
        <ul>
          <li>
            <strong>private gatherings</strong> - avoid having a single person in
            charge of music. With y2pilot you can easily have multiple people add
            videos to the playlist at any time and videos will loop non-stop. You
            can also create a playlist in advance and build on top of it on the
            spot. No need to create or switch app accounts, install apps, avoid
            being tracked for sketchy songs in your playlist...
          </li>
          <li>
            <strong>playlists for a given moment</strong> - 1. add videos you
            want to listen to in that moment, 2. listen, 3. forget that the
            playlist ever existed
          </li>
          <li>
            <strong>watch multiple videos in a row</strong> or loop them
            indefinitely without stopping. Think background music or a showcase
            scenario where the videos need to run in a loop forever, without
            interruptions
          </li>
        </ul>

        <h2>Keyboard Shortcuts</h2>
        <p>
          <span className={css.shortcutExplanation}>
            Shuffle playlist &mdash;{' '}
            <strong className={css.emphasize}>shift + s</strong>
          </span>
          <span className={css.shortcutExplanation}>
            Toggle playlist &mdash;{' '}
            <strong className={css.emphasize}>p</strong>
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
            <strong className={css.emphasize}>left arrow</strong>
          </span>
          <span className={css.shortcutExplanation}>
            Next video &mdash;{' '}
            <strong className={css.emphasize}>right arrow</strong>
          </span>
          <span className={css.shortcutExplanation}>
            Skip video &mdash;{' '}
            <strong className={css.emphasize}>1, 2, 3</strong>
          </span>
        </p>

        <br />

        <p>
          y2pilot.com is designed and developed by{' '}
          <a target="_blank" rel="noreferrer" href="https://apisurf.dev">
            apisurf.dev
          </a>
        </p>
      </div>
    </div>
  )
}
