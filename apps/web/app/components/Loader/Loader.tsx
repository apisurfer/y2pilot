import css from './Loader.module.css'

// Full-bleed centered spinner shown over the main area while a playlist is
// being loaded from a shared URL (or freshly created) and isn't ready yet.
export default function Loader() {
  return (
    <div className={css.overlay} role="status" aria-label="Loading playlist">
      <div className={css.spinner} />
    </div>
  )
}
