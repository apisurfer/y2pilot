import { createFileRoute } from '@tanstack/react-router'
import AppHeader from '~/components/AppHeader/AppHeader'
import HelpScreen from '~/components/HelpScreen/HelpScreen'
import { seoHead } from '~/lib/seo'

export const Route = createFileRoute('/help')({
  head: () =>
    seoHead({
      path: '/help',
      title: 'Help & keyboard shortcuts – y2pilot',
      description:
        'How y2pilot works: auto-saved, anonymously shareable YouTube playlists for back-to-back and looped playback, plus keyboard shortcuts.',
    }),
  component: HelpRoute,
})

function HelpRoute() {
  return (
    <div className="appContainer">
      <AppHeader activeStage="help" />
      <div className="appMain">
        <HelpScreen headingLevel="h1" />
      </div>
    </div>
  )
}
