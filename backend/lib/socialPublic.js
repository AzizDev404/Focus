import { countFollowers, countFollowing } from '../db.js'

export function socialCountsForUser(userId) {
  return {
    followersCount: countFollowers(userId),
    followingCount: countFollowing(userId),
  }
}
