import { Insertable, Kysely, PostgresDialect, sql } from 'kysely'

import { MonitorResultTable, MonitorTable } from './types'
export * from './types.js'

interface Database {
  MonitorResult: MonitorResultTable
  Monitor: MonitorTable
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    host: 'localhost',
    database: 'mondb',
    user: 'postgres',
    password: 'postgres',
  }),
})

function objectToJSON(object: any) {
  if (typeof object == 'string') {
    return object
  } else if (typeof object == 'object') {
    return JSON.stringify(object)
  }
  throw Error('Cannot convert to JSON')
}

export async function saveMonitorResult(
  result: Insertable<MonitorResultTable>
) {
  //Handle all JSON conversions here.. headers, cookies, variables etc
  let resultForSaving = {
    ...result,
    headers: objectToJSON(result.headers),
  }

  if (result.assertResults) {
    resultForSaving = {
      ...resultForSaving,
      assertResults: objectToJSON(result.assertResults),
    }
  }

  try {
    await db.insertInto('MonitorResult').values(resultForSaving).execute()
  } catch (e) {
    console.log('exception: ', e)
  }
}

export async function selectReadyMonitors() {
  const now = new Date(Date.now())
  // let's get to the closest 10 second using floor.
  // This helps when doing modulo math to figure out if a monitor is a hit to schedule
  const seconds =
    Math.floor((now.getMinutes() * 60 + now.getSeconds()) / 10) * 10

  const resp = await db
    .selectFrom('Monitor')
    .selectAll()
    .where('status', '=', 'active')
    .where(sql`${seconds} % frequency`, '=', 0)
    .execute()

  return resp
}
