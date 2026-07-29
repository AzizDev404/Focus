import type { PublicUserCard } from '../../lib/communityApi'
import type { ShopItem } from '../../lib/auth/types'
import { formatMemberSince } from '../../lib/publicProfileView'
import { ProfileGlassCard } from '../profile/ProfileGlassCard'
import { PublicProfileSocialActions } from './PublicProfileSections'

type Props = {
  user: PublicUserCard
  shopItems: ShopItem[]
  isSelf: boolean
  loggedIn: boolean
  followBusy: boolean
  onToggleFollow: () => void
  onMessage: () => void
  onOpenOwnProfile?: () => void
}

/** Full-size player card — same shell as your own Profile tab. */
export function PublicProfileCard({
  user,
  shopItems,
  isSelf,
  loggedIn,
  followBusy,
  onToggleFollow,
  onMessage,
  onOpenOwnProfile,
}: Props) {
  const memberSince = formatMemberSince(user.createdAt)
  const subtitle = memberSince ?? `Player #${user.id}`

  return (
    <ProfileGlassCard
      displayName={user.displayName}
      level={user.level}
      shopItems={shopItems}
      media={user.media}
      equipped={user.equipped}
      subtitle={subtitle}
      xpProgress={user.xpProgress}
      xpToNext={user.xpToNext}
      size="full"
      animate
      userId={user.id}
      showCharm
      charmInteractive={isSelf}
      actions={
        <div className="profile-card-actions profile-card-actions--below">
          <PublicProfileSocialActions
            user={user}
            isSelf={isSelf}
            loggedIn={loggedIn}
            followBusy={followBusy}
            onToggleFollow={onToggleFollow}
            onMessage={onMessage}
            onOpenOwnProfile={onOpenOwnProfile}
          />
        </div>
      }
    />
  )
}
