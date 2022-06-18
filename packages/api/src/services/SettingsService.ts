import { currentUserInfo } from './../Context'

import { db, NotificationChannel } from '@httpmon/db'
import { nanoid } from 'nanoid'

export class SettingsService {
  static instance: SettingsService

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  public async listNotifications() {
    const notifications = await db
      .selectFrom('NotificationChannel')
      .selectAll()
      .where('accountId', '=', currentUserInfo().accountId)
      .execute()
    return notifications
  }

  public async saveNotifcation(data: NotificationChannel) {
    const notification = await db
      .insertInto('NotificationChannel')
      .values({
        id: nanoid(),
        name: data.name,
        failCount: data.failCount,
        failTimeMS: data.failTimeMS,
        isDefaultEnabled: data.isDefaultEnabled,
        applyOnExistingMonitors: data.applyOnExistingMonitors,
        channel: data.channel,
        accountId: currentUserInfo().accountId,
      })
      .returningAll()
      .executeTakeFirst()

    return notification
  }

  public async updateNotifcation(id: string, data: NotificationChannel) {
    const notification = await db
      .updateTable('NotificationChannel')
      .set({ ...data })
      .where('id', '=', id)
      .where('accountId', '=', currentUserInfo().accountId)
      .returningAll()
      .executeTakeFirst()

    return notification
  }

  public async deleteNotification(id: string) {
    const resp = await db
      .deleteFrom('NotificationChannel')
      .where('id', '=', id)
      .where('accountId', '=', currentUserInfo().accountId)
      .executeTakeFirst()
    return resp.numDeletedRows
  }
}