import { ResultQueryString, PaginateQueryString } from '../../services/MonitorService'
import { MonitorService } from '../../services/MonitorService'
import { FastifyInstance } from 'fastify'
import S from 'fluent-json-schema'
import {
  Monitor,
  MonitorFluentSchema,
  MonitorResultFluentSchema,
  MonitorResultFluentSchemaArray,
  MonitorResultQueryResponseSchema,
  MonitorStatSummarySchema,
  PaginateQueryStringSchema,
  MonitorsQueryResponseSchema,
  MonitorTuples,
} from '@httpmon/db'
import { onRequestAuthHook } from '../RouterHooks'

export default async function MonitorRouter(app: FastifyInstance) {
  app.addHook('onRequest', onRequestAuthHook)

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
      req.log.info(`Creating monitor: ${resp?.id}`)

      reply.send(resp)
    }
  )

  app.get<{ Querystring: PaginateQueryString }>(
    '/',
    {
      schema: {
        querystring: PaginateQueryStringSchema,
        response: { 200: MonitorsQueryResponseSchema },
      },
    },
    async function ({ query: { limit, offset } }, reply) {
      const resp = await monitorSvc.list(offset, limit)
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
        response: { 200: MonitorFluentSchema },
      },
    },
    async function ({ params: { id } }, reply) {
      const mon = await monitorSvc.find(id)
      if (mon) {
        reply.send(mon)
      } else {
        reply.code(404).send(`${id} Not found`)
      }
    }
  )

  app.post<{ Params: Params; Body: Monitor }>(
    '/:id',
    {
      schema: {
        params: ParamsSchema,
        body: MonitorFluentSchema,
        response: {
          200: MonitorFluentSchema,
        },
      },
    },
    async function ({ params: { id }, body: monitor, log }, reply) {
      if (id != monitor.id) {
        reply.code(400).send('Monitor id is not valid')
        return
      }

      const resp = await monitorSvc.update(monitor)
      log.info(`Updating monitor: ${monitor.id}`)

      reply.send(resp)
    }
  )

  app.delete<{ Params: Params }>(
    '/:id',
    {
      schema: {
        params: ParamsSchema,
        body: S.number(),
      },
    },
    async function ({ params: { id }, log }, reply) {
      const resp = await monitorSvc.delete(id)
      log.info(resp, `Deleted monitor id: ${id}`)
      reply.send(resp)
    }
  )

  app.get<{ Params: Params }>(
    '/:id/results',
    {
      schema: {
        params: ParamsSchema,
        response: { 200: MonitorResultFluentSchemaArray },
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

  const ResultQueryParamsSchema = S.object()
    .prop('startTime', S.string())
    .required()
    .prop('endTime', S.string())
    .required()
    .prop('limit', S.number().default(100))
    .prop('offset', S.number().default(0))
    .prop('status', S.string())
    .prop('locations', S.string())
    .prop('getTotals', S.boolean().default(false))

  app.get<{ Params: Params; Querystring: ResultQueryString }>(
    '/:id/resultsEx',
    {
      schema: {
        params: ParamsSchema,
        querystring: ResultQueryParamsSchema,
        response: { 200: MonitorResultQueryResponseSchema },
      },
    },
    async function (req, reply) {
      const results = await monitorSvc.getMonitorResultsEx(
        req.params.id,
        req.query
      )
      if (results) {
        reply.send(results)
      } else {
        reply.code(404).send('Not found')
      }
    }
  )

  app.get<{ Params: Params }>(
    '/:id/stats',
    {
      schema: {
        params: ParamsSchema,
        response: { 200: MonitorStatSummarySchema },
      },
    },
    async (req, res) => {
      const resp = await monitorSvc.getMonitorStatSummary(req.params.id)
      res.send(resp)
    }
  )

  app.get<{ Params: Params }>(
    '/stats',
    {
      schema: {
        params: ParamsSchema,
        response: { 200: S.array().items(MonitorStatSummarySchema) },
      },
    },
    async (_req, res) => {
      const resp = await monitorSvc.getAllMonitorStatSummaries()
      res.send(resp)
    }
  )

  /**
   * Get all monitor results
   */
  app.get<{ Params: Params }>(
    '/results',
    {
      schema: {
        response: { 200: MonitorResultFluentSchemaArray },
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

  app.get<{ Params: Params }>(
    '/results/:id',
    {
      schema: {
        params: ParamsSchema,
        response: { 200: MonitorResultFluentSchema },
      },
    },
    async function ({ params: { id } }, reply) {
      const results = await monitorSvc.findResult(id)
      if (results) {
        reply.send(results)
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
        response: { 200: MonitorResultFluentSchemaArray },
      },
    },
    async function (req, reply) {
      await monitorSvc.setEnv(req.params.id, req.body)
      reply.send('env set')
    }
  )
}
