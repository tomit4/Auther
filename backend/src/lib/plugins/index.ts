export default async fastify => {
    await fastify.register(require('@fastify/cors'))
}
