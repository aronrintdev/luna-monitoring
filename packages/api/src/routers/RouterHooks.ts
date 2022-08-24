import { FastifyReply, FastifyRequest } from 'fastify'
import { requestContext } from 'fastify-request-context'
import { firebaseAuth } from '../Firebase'
import { createNewAccount, getAccountIdByUser, getRoleFromAccountId } from '../services/DBService'

export async function onRequestAuthHook(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization ?? ''
  let user = null
  const curAccountId = (request.headers['x-proautoma-accountid'] as string) ?? ''

  const [bearer = '', token] = authHeader.split(' ')
  if (bearer.trim().toLowerCase() !== 'bearer') {
    request.log.error('error in parsing auth header')
    reply.code(401).send({ message: 'Bad token format' })
    return
  }

  try {
    user = await firebaseAuth.verifyIdToken(token)
  } catch (error) {
    request.log.error(error)
    reply.code(401).send({ message: 'Not authorized' })
    return
  }

  if (curAccountId && user.email) {
    const role = await getRoleFromAccountId(curAccountId, user.email)
    request.requestContext.set('user', {
      user: user.email,
      accountId: curAccountId,
      role,
    })
  } else {
    let accountId = await getAccountIdByUser(user.uid)
    if (!accountId) {
      request.log.error(`user ${user.uid} ${user.email} not found`)

      //It may be a new user, so create an account for them
      accountId = await createNewAccount(user.uid, user.email ?? '')
    }
    request.requestContext.set('user', { user: user.email ?? '', accountId })
  }

  request.log.info(requestContext.get('user'), 'user authorized')
}

export async function onOwnerRequestAuthHook(_: FastifyRequest, reply: FastifyReply) {
  const user = requestContext.get('user')

  if (user && user.role !== '' && user.role !== 'owner') {
    reply.code(403).send({ message: 'Access denied' })
  }
}

export async function onAdminRequestAuthHook(_: FastifyRequest, reply: FastifyReply) {
  const user = requestContext.get('user')

  if (user && user.role === 'viewer') {
    reply.code(403).send({ message: 'Access denied' })
  }
}
