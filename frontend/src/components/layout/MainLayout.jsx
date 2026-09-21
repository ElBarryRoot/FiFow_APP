import BottomNav from './BottomNav.jsx'
import PageFrame from './PageFrame.jsx'

export default function MainLayout({ children, connected = false }) {
  return (
    <PageFrame>
      <div className="pb-24 lg:pb-14">{children}</div>
      <BottomNav connected={connected} />
    </PageFrame>
  )
}
