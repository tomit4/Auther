export default async fastify => {
    await fastify.register(import('./onboarding/email'))
}
