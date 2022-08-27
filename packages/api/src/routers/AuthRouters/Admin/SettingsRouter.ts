import { FastifyInstance } from 'fastify'
import S from 'fluent-json-schema'
import { nanoid } from 'nanoid'
import {
  NotificationSchema,
  NotificationChannel,
  SettingsSchema,
  Settings,
  NotificationEmail,
  NotificationEmailSchema,
  EmailVerification,
  EmailVerificationSchema,
  UserAccountSchema,
} from '@httpmon/db'
import {
  Params,
  ParamsSchema,
  NotificationEmailsParams,
  NotificationEmailsParamsSchema,
  UserInviteSchema,
  UserInvite,
  RoleUpdate,
  RoleUpdateSchema,
} from '../../../types'
import { onAdminRequestAuthHook, onRequestAuthHook } from '../../RouterHooks'
import { SettingsService } from '../../../services/SettingsService'
import { currentUserInfo } from '../../../Context'

export default async function SettingsRouter(app: FastifyInstance) {
  app.addHook('onRequest', onRequestAuthHook)
  app.addHook('onRequest', onAdminRequestAuthHook)

  const settingsService = SettingsService.getInstance()

  // GET /
  app.get(
    '/',
    {
      schema: {
        response: {
          200: SettingsSchema,
        },
      },
    },
    async function (req, reply) {
      if (currentUserInfo().role === 'viewer') {
        reply.status(403).send()
      }
      const resp = await settingsService.getSettings()
      req.log.info(`Get settings: ${JSON.stringify(resp)}`)
      reply.send(resp)
    }
  )

  // PUT /
  app.put<{ Body: Settings; Params: Params }>(
    '/',
    {
      schema: {
        params: ParamsSchema,
        body: SettingsSchema,
        response: {
          200: SettingsSchema,
        },
      },
    },
    async function (req, reply) {
      const data = req.body
      const resp = await settingsService.updateSettings(data)
      req.log.info(`Updating settings: ${JSON.stringify(resp)}`)
      reply.send(resp)
    }
  )

  // GET /notifications
  app.get(
    '/notifications',
    {
      schema: {
        response: {
          200: S.array().items(NotificationSchema),
        },
      },
    },
    async function (_, reply) {
      if (currentUserInfo().role === 'viewer') {
        reply.status(403).send()
      }
      const resp = await settingsService.listNotifications()
      reply.send(resp)
    }
  )

  // POST /notifications
  app.post<{ Body: NotificationChannel }>(
    '/notifications',
    {
      schema: {
        body: NotificationSchema,
        response: {
          201: NotificationSchema,
        },
      },
    },
    async function (req, reply) {
      const data = req.body

      const resp = await settingsService.saveNotifcation(data)
      req.log.info(`Creating new notification: ${resp?.id}`)
      reply.send(resp)
    }
  )

  // PUT /notifications/:id
  app.put<{ Body: NotificationChannel; Params: Params }>(
    '/notifications/:id',
    {
      schema: {
        params: ParamsSchema,
        body: NotificationSchema,
        response: {
          200: NotificationSchema,
        },
      },
    },
    async function (req, reply) {
      const data = req.body
      const { id } = req.params

      const resp = await settingsService.updateNotifcation(id, data)
      req.log.info(`Updating notification: ${JSON.stringify(resp)}`)
      reply.send(resp)
    }
  )

  // DELETE /notifications/:id
  app.delete<{ Params: Params }>(
    '/notifications/:id',
    {
      schema: {
        params: ParamsSchema,
        body: S.number(),
      },
    },
    async function ({ params: { id }, log }, reply) {
      const resp = await settingsService.deleteNotification(id)
      log.info(resp, `Deleted notification id: ${id}`)
      reply.send(resp)
    }
  )

  // GET /notifications/emails
  app.get<{ Querystring: NotificationEmailsParams }>(
    '/notifications/emails',
    {
      schema: {
        querystring: NotificationEmailsParamsSchema,
        response: {
          200: S.array().items(NotificationEmailSchema),
        },
      },
    },
    async function ({ query: { status } }, reply) {
      const resp = await settingsService.listNotificationEmails(status)
      reply.send(resp)
    }
  )

  // POST /notifications/emails
  app.post<{ Body: NotificationEmail }>(
    '/notifications/emails',
    {
      schema: {
        body: NotificationEmailSchema,
        response: {
          201: NotificationEmailSchema,
        },
      },
    },
    async function (req, reply) {
      const data = req.body
      const token = nanoid(64)

      const resp = await settingsService.saveNotifcationEmail(data, token)
      reply.send(resp)
    }
  )

  // DELETE /notifications/emails/:id
  app.delete<{ Params: Params }>(
    '/notifications/emails/:id',
    {
      schema: {
        params: ParamsSchema,
        body: S.number(),
      },
    },
    async function ({ params: { id } }, reply) {
      const resp = await settingsService.deleteNotificationEmail(id)
      reply.send(resp)
    }
  )

  // POST /notifications/emails/send-verification-mail
  app.post<{ Body: EmailVerification }>(
    '/notifications/emails/send-verification-mail',
    {
      schema: {
        body: EmailVerificationSchema,
        response: {
          200: S.boolean(),
        },
      },
    },
    async function (req, reply) {
      const { email } = req.body
      const token = nanoid(64)
      const resp = await settingsService.resendVerificationMail(email, token)
      reply.send(resp)
    }
  )

  // GET /users
  app.get(
    '/users',
    {
      schema: {
        response: {
          200: S.array().items(UserAccountSchema),
        },
      },
    },
    async function (_, reply) {
      const resp = await settingsService.listUsers()
      reply.send(resp)
    }
  )

  // POST /users/invite
  app.post<{ Body: UserInvite }>(
    '/users/invite',
    {
      schema: {
        body: UserInviteSchema,
      },
    },
    async function (req, reply) {
      const data = req.body
      const token = nanoid(64)

      const resp = await settingsService.sendUserInvite(data, token)
      reply.send(resp)
    }
  )

  // PUT /users/:id
  app.put<{ Body: RoleUpdate; Params: Params }>(
    '/users/:id',
    {
      schema: {
        params: ParamsSchema,
        body: RoleUpdateSchema,
      },
    },
    async function (req, reply) {
      const data = req.body
      const { id } = req.params

      const resp = await settingsService.updateUserRole(id, data.role)
      req.log.info(`Updating user role: ${JSON.stringify(resp)}`)
      reply.send(resp)
    }
  )

  // DELETE /users/:id
  app.delete<{ Params: Params }>(
    '/users/:id',
    {
      schema: {
        params: ParamsSchema,
      },
    },
    async function (req, reply) {
      const { id } = req.params

      const resp = await settingsService.deleteUser(id)
      req.log.info(`Delete user: ${JSON.stringify(resp)}`)
      reply.send(resp)
    }
  )

  interface TeamsParams {
    email: string
  }

  // GET /users/:email/teams
  app.get<{ Params: TeamsParams }>(
    '/users/:email/teams',
    {
      schema: {
        response: {
          200: S.array().items(UserAccountSchema),
        },
      },
    },
    async function ({ params: { email } }, reply) {
      const resp = await settingsService.getTeams(email)
      reply.send(resp)
    }
  )
}
