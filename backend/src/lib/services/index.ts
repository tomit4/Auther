import type {
    FastifyInstance,
    FastifyPluginOptions,
    HookHandlerDoneFunction,
} from 'fastify'
import fp from 'fastify-plugin'
import UserService from './user-service'

declare module 'fastify' {
    interface FastifyInstance {
        userService: UserService
    }
}

const userServicePlugin = (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    next: HookHandlerDoneFunction,
) => {
    try {
        if (!fastify.userService) {
            const newUserService = new UserService(fastify)
            fastify.decorate('userService', newUserService)
        }
        next()
    } catch (err) {
        if (err instanceof Error) next(err)
    }
}

const userService = fp(userServicePlugin, {
    name: 'fastify-user-service-plugin',
})

export default async (fastify: FastifyInstance) => {
    await fastify.register(userService)
}
