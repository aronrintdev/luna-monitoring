import { db, MonitorResultTable } from '@httpmon/db'
import { Insertable } from 'kysely'
import { v4 as uuidv4 } from 'uuid'
import { currentUserInfo, logger } from '../Context'
import { nanoid } from 'nanoid'
import { createBucket, uploadObject } from './GSCService'

//core function to validate token and identify correct UserAccount credentials
export const getUserAccount = async (userId: string, requestedAccountId: string | null) => {
  const userAccounts = await db
    .selectFrom('UserAccount')
    .selectAll()
    .where('userId', '=', userId)
    .where('isVerified', '=', true)
    .execute()

  if (!userAccounts || userAccounts.length < 1) return null

  //if accountId is given, it must match
  if (requestedAccountId) {
    return userAccounts.find((acct) => acct.accountId == requestedAccountId)
  } else {
    //accountId is not provided, so choose primary account
    const currentUser = userAccounts.find((acct) => acct.isPrimary == true)
    if (currentUser) {
      return currentUser
    }
    // looks like primay is somehow missed, just choose first account
    return userAccounts[0]
  }
}

export const processInvitedAccounts = async (userId: string, email: string) => {
  await db
    .updateTable('UserAccount')
    .set({ userId })
    .where('email', '=', email)
    .where('userId', '<>', '')
    .execute()
}

export const createNewAccount = async (userId: string, email: string) => {
  const newUserAccount = await db.transaction().execute(async (trx) => {
    //create account
    let account = await trx
      .insertInto('Account')
      .values({
        id: uuidv4(),
        owner: email,
        name: `By ${email}`,
      })
      .returningAll()
      .executeTakeFirst()

    if (!account || !account.id) {
      throw new Error('not able to create account')
    }

    const userAccount = await trx
      .insertInto('UserAccount')
      .values({
        id: uuidv4(),
        userId: userId,
        email: email,
        accountId: account.id,
        isPrimary: true,
        role: 'owner',
        isVerified: true,
      })
      .returningAll()
      .executeTakeFirst()

    if (!userAccount || !userAccount.id) {
      throw new Error('not able to add to user account')
    }

    // Add settings for new user account
    await trx
      .insertInto('Settings')
      .values({
        id: nanoid(),
        accountId: account.id,
        alert: { failCount: 1, failTimeMinutes: 0 },
      })
      .returningAll()
      .executeTakeFirst()

    // Set free plan to new user account
    await trx
      .insertInto('BillingInfo')
      .values({
        id: nanoid(),
        accountId: account.id,
        billingPlanType: 'free',
        monitorRunsLimit: 50000,
      })
      .returningAll()
      .executeTakeFirst()

    logger.info(
      `created new account for user ${userId} ${email} account id ${userAccount.accountId}`
    )
    return userAccount
  })

  if (newUserAccount) {
    // create GCS bucket
    await createBucket(newUserAccount.accountId)
  }

  return newUserAccount
}

function objectToJSON(object: any) {
  if (typeof object == 'string') {
    return object
  } else if (typeof object == 'object') {
    return JSON.stringify(object)
  }
  throw Error('Cannot convert to JSON')
}

export async function saveMonitorResult(result: Insertable<MonitorResultTable>) {
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

  let savedResult

  try {
    if (result.monitorId.startsWith('ondemand')) {
      //save on demand result and return
      return await db
        .insertInto('OndemandResult')
        .values({
          ...resultForSaving,
          id: uuidv4(),
          accountId: currentUserInfo().accountId,
        })
        .returningAll()
        .executeTakeFirst()
    }

    savedResult = await db
      .insertInto('MonitorResult')
      .values({
        ...resultForSaving,
        id: uuidv4(),
        body: '',
        headers: '[]',
      })
      .returningAll()
      .executeTakeFirst()

    if (savedResult && savedResult.id) {
      // Saving body and headers to cloud storage
      const { monitorId, body, headers } = resultForSaving
      uploadObject(result.accountId, `${monitorId}/${savedResult.id}`, 'body', body)
      uploadObject(result.accountId, `${monitorId}/${savedResult.id}`, 'headers', headers)
    }
    return savedResult
  } catch (e) {
    logger.error(e, 'exception in saving monitor result')
    return null
  }
}
