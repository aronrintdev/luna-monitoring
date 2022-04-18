import { logger } from './Context'
import fastify from 'fastify'
import fastifyCors from 'fastify-cors'
import router from './router.js'
import * as dotenv from 'dotenv'
import path from 'path'
import { schedule } from './services/DevScheduler.js'
import fastifyStatic from 'fastify-static'
import { initializeRequestContext } from './Context.js'

//find and load the .env from root folder of the project
dotenv.config({ path: path.resolve(process.cwd(), '../..', '.env') })

const server = fastify({
  logger: {
    prettyPrint: true,
    level: 'info',
  },
})

initializeRequestContext(server)

if (process.env.NODE_ENV === 'production') {
  server.log.info('production mode')
  server.register(fastifyStatic, {
    root: path.join(process.cwd(), './packages/web/dist/'),
    prefix: '/', // optional: default '/'
  })

  server.setNotFoundHandler(async (req, reply) => {
    //this is hack with knowledge of route prefix /api built in
    //unfortunately, router-specifc handler is not being called
    if (req.url.startsWith('/api')) {
      reply.code(404).send('not found')
      return
    }
    //@ts-ignore
    await reply.sendFile('index.html')
  })
} else {
  server.log.info('test mode')
  server.register(fastifyCors, {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  })
}

// Middleware: Router
server.register(router, {
  prefix: '/api',
})

server.setErrorHandler((error, _req, reply) => {
  // The expected errors will be handled here, but unexpected ones should eventually result in a crash.
  server.log.error(error)
  reply.code(409).send({ error: 'top level error' })
})

if (process.env.NODE_ENV !== 'production') {
  const IntervalSeconds = 10 // every 10 seconds
  setInterval(async () => {
    schedule()
  }, IntervalSeconds * 1000)
}

export default server
