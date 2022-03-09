import { execMonitor } from './../services/monitor-exec.js'
import { MonitorService } from './../services/monitor-service.js'
import { FastifyInstance } from 'fastify'
import S from 'fluent-json-schema'
import {
  Monitor,
  MonitorFluentSchema,
  MonitorResultSchemaArray,
  MonitorSchema,
  MonitorTuples,
} from '@httpmon/db'

export default async function MonitorController(app: FastifyInstance) {
  const monitorSvc = MonitorService.getInstance()

  app.put<{ Body: Monitor }>(
    '/',
    {
      schema: {
        body: MonitorFluentSchema,
        response: {
          200: MonitorFluentSchema,
        },
      },
    },
    async function (req, reply) {
      const mon = req.body

      const resp = await monitorSvc.create(mon)

      req.log.info(mon, 'create mon')
      req.log.info(resp, 'resp mon')

      reply.send(resp)
    }
  )

  app.post<{ Body: Monitor }>(
    '/',
    {
      schema: {
        body: MonitorFluentSchema,
        response: {
          200: MonitorFluentSchema,
        },
      },
    },
    async function (req, reply) {
      const mon = req.body

      const resp = await monitorSvc.update(mon)

      req.log.info(mon, 'updating monitor')
      req.log.info(resp, 'resp mon')

      reply.send(resp)
    }
  )

  app.get(
    '/',
    {
      schema: {
        response: {},
      },
    },
    async function (_, reply) {
      const resp = await monitorSvc.list()

      reply.send(resp)
    }
  )

  const ParamsSchema = S.object().prop('id', S.string())
  type Params = {
    id: string
  }

  app.get<{ Params: Params }>(
    '/:id',
    {
      schema: {
        params: ParamsSchema,
        response: { 200: MonitorSchema },
      },
    },
    async function ({ params: { id } }, reply) {
      const mon = await monitorSvc.find(id)
      if (mon) {
        reply.send(mon)
      } else {
        reply.code(404).send('Not found')
      }
    }
  )

  app.get<{ Params: Params }>(
    '/:id/results',
    {
      schema: {
        params: ParamsSchema,
        response: { 200: MonitorResultSchemaArray },
      },
    },
    async function ({ params: { id } }, reply) {
      const results = await monitorSvc.getMonitorResults(id)
      if (results) {
        reply.send(results)
      } else {
        reply.code(404).send('Not found')
      }
    }
  )

  /**
   * Get all monitor results
   */
  app.get<{ Params: Params }>(
    '/results',
    {
      schema: {
        response: { 200: MonitorResultSchemaArray },
      },
    },
    async function (_, reply) {
      const mon = await monitorSvc.getMonitorResults()
      if (mon) {
        reply.send(mon)
      } else {
        reply.code(404).send('Not found')
      }
    }
  )

  app.post<{ Body: MonitorTuples; Params: Params }>(
    '/:id/env',
    {
      schema: {
        params: ParamsSchema,
        // response: { 200: Type.Array(MonitorResultSchema) },
      },
    },
    async function (req, reply) {
      await monitorSvc.setEnv(req.params.id, req.body)
      reply.send('env set')
    }
  )

  app.post<{ Body: Monitor }>(
    '/ondemand',
    {
      schema: {
        body: MonitorFluentSchema,
        // response: {
        //   200: MonitorResultSchema,
        // },
      },
    },
    async function (req, reply) {
      const mon = req.body
      req.log.info(mon, 'exec')

      const resp = await execMonitor(mon)

      reply.send(resp)
    }
  )
}
