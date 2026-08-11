const DICEBEAR_VERSION = "10.x"
const DEFAULT_STYLE = "adventurer"
const DEFAULT_SEED = "Felix"

export const avatarUrl = (
  seed: string = DEFAULT_SEED,
  { style = DEFAULT_STYLE, size = 128 }: { style?: string; size?: number } = {}
) =>
  `https://api.dicebear.com/${DICEBEAR_VERSION}/${style}/png?seed=${encodeURIComponent(
    seed
  )}&size=${size}`

export const PINGX_AVATAR = avatarUrl(DEFAULT_SEED)
