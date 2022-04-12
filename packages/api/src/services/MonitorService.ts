import emitter from './emitter.js'

import { db, Monitor, MonitorResult, MonitorTuples } from '@httpmon/db'
import { nanoid } from 'nanoid'
import pino from 'pino'

const logger = pino()

export interface ResultQueryString {
  startTime: string
  endTime: string
  limit: number
  offset: number
  status?: string
  locations: string
}

/**
 *
 * Super hacky function to go around type safety
 * Since PG cannot take JSON arrays as is
 * (it converts them into PG array which is not what we want)
 * here, convert all JSON arrays into JSON as a string
 * @param mon
 * @returns
 */
function monitorToDBMonitor(mon: Monitor): Monitor {
  let values: { [k: string]: any } = { ...mon }
  if (values.headers) values.headers = JSON.stringify(values.headers)
  if (values.queryParams)
    values.queryParams = JSON.stringify(values.queryParams)
  if (values.env) values.env = JSON.stringify(values.env)
  if (values.assertions) values.assertions = JSON.stringify(values.assertions)

  return values as Monitor
}

export class MonitorService {
  static instance: MonitorService

  public static getInstance(): MonitorService {
    if (!MonitorService.instance) {
      MonitorService.instance = new MonitorService()
    }
    return MonitorService.instance
  }

  public async create(mon: Monitor) {
    logger.info(mon, 'creating mon')

    const monResp = await db
      .insertInto('Monitor')
      .values({ ...monitorToDBMonitor(mon), id: nanoid() })
      .returningAll()
      .executeTakeFirst()

    emitter.emit('monitor', monResp?.id)
    return monResp
  }

  public async update(mon: Monitor) {
    const monResp = await db
      .updateTable('Monitor')
      .set({ ...monitorToDBMonitor(mon) })
      .where('id', '=', mon.id)
      .returningAll()
      .executeTakeFirst()
    return monResp
  }

  public async delete(id: string) {
    const resp = await db
      .deleteFrom('Monitor')
      .where('id', '=', id)
      .executeTakeFirst()
    return resp.numDeletedRows
  }

  public async find(id: string) {
    const monResp = await db
      .selectFrom('Monitor')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    return monResp
  }

  public async list() {
    const monList = await db.selectFrom('Monitor').selectAll().execute()
    return monList
  }

  public async findResult(id: string) {
    const monResultResp = await db
      .selectFrom('MonitorResult')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    return monResultResp
  }

  /**
   * Reads the last 100 monitor results for the given monitor
   *
   * Ideally:
   *
   * - We should be able to query for results in a given time range
   *  (e.g. last 15 mins, 1 hour, 3 hours, 1 day, 7 days, 30 days, custom range)
   *
   * - We should be able to query for results for a given location
   * - We should be able to query for results for successful or failed
   *
   */
  public async getMonitorResults(monitorId?: string) {
    //having a const column array causes type error which is weird
    const results = await db
      .selectFrom('MonitorResult')
      .select([
        'id',
        'monitorId',
        'url',
        'code',
        'codeStatus',
        'createdAt',
        'waitTime',
        'dnsTime',
        'tcpTime',
        'tlsTime',
        'uploadTime',
        'ttfb',
        'downloadTime',
        'totalTime',
        'ip',
        'location',
        'err',
        'protocol',
        'ttfb',
        'assertResults',
      ])
      .if(Boolean(monitorId), (qb) =>
        qb.where('monitorId', '=', monitorId as string)
      )
      .limit(100)
      .orderBy('MonitorResult.createdAt', 'desc')
      .execute()

    return results
  }

  public async getMonitorResultsEx(
    monitorId: string,
    query: ResultQueryString
  ) {
    logger.info(query, 'query')
    const locations = query.locations ? query.locations.split(',') : []
    const okStatus = query.status === 'ok'
    const errStatus = query.status === 'err'

    //having a const column array causes type error which is weird
    const results = await db
      .selectFrom('MonitorResult')
      .select([
        'id',
        'monitorId',
        'url',
        'code',
        'codeStatus',
        'createdAt',
        'waitTime',
        'dnsTime',
        'tcpTime',
        'tlsTime',
        'uploadTime',
        'ttfb',
        'downloadTime',
        'totalTime',
        'ip',
        'location',
        'err',
        'protocol',
        'ttfb',
        'assertResults',
      ])
      .if(Boolean(monitorId), (qb) =>
        qb.where('monitorId', '=', monitorId as string)
      )
      .orderBy('MonitorResult.createdAt', 'desc')
      .where('createdAt', '>=', query.startTime)
      .where('createdAt', '<', query.endTime)
      .if(locations.length > 0, (qb) => qb.where('location', 'in', locations))
      .if(okStatus, (qb) => qb.where('err', '=', ''))
      .if(errStatus, (qb) => qb.where('err', '<>', ''))
      .offset(query.offset)
      .limit(query.limit)
      .execute()

    logger.info(results, 'resultsEx')

    return results
  }

  public async setEnv(monitorId: string, env: MonitorTuples) {
    await db
      .updateTable('Monitor')
      .set({ env: JSON.stringify(env) as any })
      .where('id', '=', monitorId)
      .execute()
  }
}
