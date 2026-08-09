// AUTO-GENERATED — node scripts/build-pic-manifest.mjs
// Public open source builds ship without bundled personal background images.
// Add your own files under public/pic/<desktop|mobile>/ and regenerate this
// manifest if you want custom image themes in a private deployment.

export interface PersonalPic {
  /** Stable theme id, used by useFlocusStore.settings.theme* */
  id: string
  /** Human-readable label shown under the swatch */
  name: string
  /** Landscape image URL — preferred on viewports ≥ 768px wide */
  desktop: string | null
  /** Portrait image URL — preferred on viewports < 768px wide */
  mobile: string | null
}

export const PERSONAL_PICS: readonly PersonalPic[] = []

export const PIC_DESKTOP: readonly string[] = PERSONAL_PICS
  .map((p) => p.desktop)
  .filter((url): url is string => url !== null)

export const PIC_MOBILE: readonly string[] = PERSONAL_PICS
  .map((p) => p.mobile)
  .filter((url): url is string => url !== null)

export const HAS_PERSONAL_PICS = PERSONAL_PICS.length > 0
