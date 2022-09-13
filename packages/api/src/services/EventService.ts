import { PubSub } from '@google-cloud/pubsub'
import { logger, state } from '../Context'
import emitter from './emitter'
import { MonitorRunResult } from '@httpmon/db'

let pubsub: PubSub | null = null

export async function publishPostRequestEvent(event: MonitorRunResult) {
  if (!state.projectId || process.env.NODE_ENV !== 'production') {
    publishLocally(event)
    return
  }

  const projectId = state.projectId
  if (!pubsub) {
    pubsub = new PubSub({ projectId })
  }

  if (!pubsub) throw new Error('Pubsub is not initialized')

  //publish  to cloud pubsub
  const topic = `${projectId}-monitor-postrequest`
  try {
    await pubsub.topic(topic).publishMessage({ attributes: { type: topic }, json: event })
    logger.info({ runId: event.runId }, `Published ${topic}`)
  } catch (error) {
    logger.error(error, `Received error while publishing to postrequest`)
  }
}

function publishLocally(monrun: MonitorRunResult) {
  logger.info(monrun.resultId, 'Publishing locally')
  emitter.emit('monitor-postrequest', monrun)
}

export async function publishMessage(topic: string, event: any) {
  const projectId = state.projectId
  if (!pubsub) {
    pubsub = new PubSub({ projectId })
  }

  if (!pubsub) throw new Error('Pubsub is not initialized')

  //publish  to cloud pubsub
  try {
    await pubsub.topic(topic).publishMessage({ attributes: { type: topic }, json: event })
    logger.info({ runId: event.runID }, `Published to ${topic}`)
  } catch (error) {
    logger.error(error, `Received error while publishing to ${topic}`)
  }
  return event
}

export async function publishMonitorRunMessage(monrun: MonitorRunResult) {
  const projectId = state.projectId
  if (!pubsub) {
    pubsub = new PubSub({ projectId })
  }

  if (!pubsub) throw new Error('Pubsub is not initialized')

  if (!monrun.mon.locations || monrun.mon.locations.length < 1) return

  monrun.mon.locations.forEach(async (locationName) => {
    const TOPIC_NAME = `${projectId}-monitor-run-${locationName}`
    try {
      await pubsub?.topic(TOPIC_NAME).publishMessage({ json: monrun })
    } catch (error) {
      logger.error(error, `Received error while publishing to ${TOPIC_NAME}`)
    }
  })
}
