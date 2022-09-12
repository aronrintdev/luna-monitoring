import { FastifyInstance } from 'fastify'
import S from 'fluent-json-schema'
import {
  NotificationSchema,
  NotificationChannel,
  SettingsSchema,
  Settings,
} from '@httpmon/db'
import {
  Params,
  ParamsSchema,
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
}
