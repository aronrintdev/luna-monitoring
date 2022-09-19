import { PubSub } from '@google-cloud/pubsub'
import { logger, state } from '../Context'
import emitter from './emitter'
import { Monitor, MonitorRunResult } from '@httpmon/db'

let pubsub: PubSub | null = null

export async function publishMonitorPreRequestMessage(mon: Monitor) {
  const projectId = state.projectId

  if (!state.projectId || process.env.NODE_ENV !== 'production') {
    emitter.emit('monitor-prerequest', mon)
    return
  }

  if (!pubsub) {
    pubsub = new PubSub({ projectId })
  }

  if (!pubsub) throw new Error('Pubsub is not initialized')

  const TOPIC_NAME = `${projectId}-monitor-prerequest`
  try {
    await pubsub?.topic(TOPIC_NAME).publishMessage({ json: mon })
  } catch (error) {
    logger.error(`Received error while publishing to ${TOPIC_NAME} - ${error.message}`)
  }
}

export async function publishScriptRunMessage(monrun: MonitorRunResult) {
  if (!state.projectId || process.env.NODE_ENV !== 'production') {
    logger.info(monrun.resultId, 'Publishing locally')
    emitter.emit('api-script-run', monrun)
    return
  }

  const projectId = state.projectId
  if (!pubsub) {
    pubsub = new PubSub({ projectId })
  }

  if (!pubsub) throw new Error('Pubsub is not initialized')

  //publish  to cloud pubsub
  const topic = `${projectId}-api-script-run`
  try {
    await pubsub.topic(topic).publishMessage({ attributes: { type: topic }, json: monrun })
    logger.info({ runId: monrun.runId }, `Published ${topic}`)
  } catch (error) {
    logger.error(error, `Received error while publishing to script-run`)
  }
}

export async function publishPostRequestMessage(monrun: MonitorRunResult) {
  if (!state.projectId || process.env.NODE_ENV !== 'production') {
    logger.info(monrun.resultId, 'Publishing locally')
    emitter.emit('monitor-postrequest', monrun)
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
    await pubsub.topic(topic).publishMessage({ attributes: { type: topic }, json: monrun })
    logger.info({ runId: monrun.runId }, `Published ${topic}`)
  } catch (error) {
    logger.error(error, `Received error while publishing to postrequest`)
  }
}

export async function publishMonitorRunMessage(monrun: MonitorRunResult) {
  const projectId = state.projectId

  if (!state.projectId || process.env.NODE_ENV !== 'production') {
    logger.info(monrun.resultId, 'Publishing monitor-run locally')
    emitter.emit('monitor-run', monrun)
    return
  }

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
