import { Router } from 'express'
import { findUserById, getFollowStatus, countFollowers, countFollowing } from '../db.js'
import { publicUserCard } from '../lib/publicProfile.js'
import { optionalUserMiddleware } from '../auth.js'

export function createUsersRouter({ jwtSecret }) {
  const router = Router()

  router.get('/:id', optionalUserMiddleware(jwtSecret), (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid user id' })
    }
    const user = findUserById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const card = publicUserCard(user)
    const social =
      req.auth?.sub && req.auth.sub !== id
        ? getFollowStatus(req.auth.sub, id)
        : {
            followersCount: countFollowers(id),
            followingCount: countFollowing(id),
            isFollowing: false,
            isFollowedBy: false,
          }

    res.json({
      user: {
        ...card,
        ...social,
      },
    })
  })

  return router
}
