import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

// Isolated so emoji-mart + its data only enter the bundle via the dynamic
// import in PlaylistMeta — they never load during SSR/prerender.
//
// emoji-mart renders inside a shadow DOM and ships its emoji data locally
// (passed via `data`), so it's immune to ancestor layout/CSS quirks and needs
// no network fetch. `set="native"` renders real unicode glyphs.
export default function EmojiPickerLazy({
  onPick,
}: {
  onPick: (emoji: string) => void
}) {
  return (
    <Picker
      data={data}
      onEmojiSelect={(emoji: { native: string }) => onPick(emoji.native)}
      set="native"
      theme="dark"
      previewPosition="none"
      skinTonePosition="none"
      navPosition="top"
      perLine={8}
    />
  )
}
