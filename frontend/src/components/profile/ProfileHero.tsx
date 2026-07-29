import type { ShopItem, UserProfile } from '../../lib/auth/types'
import { Pencil } from '../icons'
import { ProfileSocialCounts } from '../account/PublicProfileSections'
import { ProfileGlassCard } from './ProfileGlassCard'

type Props = {
  profile: UserProfile
  shopItems: ShopItem[]
  previewMode?: boolean
  onOpenEdit?: () => void
  onProfileChange?: (profile: UserProfile) => void
}

export function ProfileCard({
  profile,
  shopItems,
  previewMode = false,
  onOpenEdit,
  onProfileChange: _onProfileChange,
}: Props) {
  const openEdit = previewMode ? undefined : onOpenEdit

  return (
    <ProfileGlassCard
      displayName={profile.displayName}
      level={profile.level}
      shopItems={shopItems}
      media={profile.media}
      equipped={profile.equipped}
      subtitle={profile.email}
      xpProgress={profile.xpProgress}
      xpToNext={profile.xpToNext}
      size="full"
      animate={!previewMode}
      userId={profile.id}
      charmInteractive={!previewMode}
      showCharm
      actions={
        <div className="profile-card-actions profile-card-actions--below">
          <div className="account-hub-profile-actions">
            <ProfileSocialCounts
              userId={profile.id}
              followers={profile.followersCount ?? 0}
              following={profile.followingCount ?? 0}
            />
            {openEdit ? (
              <button type="button" className="profile-edit-btn profile-edit-btn--compact" onClick={openEdit}>
                <Pencil size={12} aria-hidden /> Edit profile
              </button>
            ) : null}
          </div>
        </div>
      }
    />
  )
}

/** @deprecated use ProfileCard */
export const ProfileHero = ProfileCard
