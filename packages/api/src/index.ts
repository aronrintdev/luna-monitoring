import app from './app.js'

const FASTIFY_PORT = Number(process.env.PORT) || 8080

app.listen(FASTIFY_PORT, '0.0.0.0')
console.log(`🚀  Fastify server running on port ${FASTIFY_PORT}`)
