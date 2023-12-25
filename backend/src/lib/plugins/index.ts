import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fastifyEnv from '@fastify/env'
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import knexConfig from '../../knexfile'
const knexFile = knexConfig.development
import fastifyCors, { FastifyCorsOptions } from '@fastify/cors'

type CustomFastifyCorsOptions = FastifyCorsOptions & {
    allowHeaders?: string
}

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(
        fastifyCors as FastifyPluginAsync<CustomFastifyCorsOptions>,
        {
            origin: true,
            credentials: true,
            allowHeaders: 'Content-Type, Authorization',
        },
    )
    await fastify.register(import('@fastify/helmet'))
    await fastify.register(import('fastify-bcrypt'))
    await fastify.register(import('@fastify/cookie'), {
        secret: process.env.COOKIE_SECRET as string,
        hook: 'onRequest',
    })
    await fastify.register(import('@fastify/redis'), {
        host: process.env.REDIS_HOST as string,
        port: process.env.REDIS_PORT as unknown as number,
        // TODO: Reinstate once working within docker
        // password: process.env.REDIS_PASSWORD as string,
    })
    await fastify.register(import('./knex'), knexFile)
    await fastify.register(import('@fastify/jwt'), {
        secret: process.env.JWT_SECRET as string,
    })
    await fastify.register(import('./authenticate'))
    await fastify.register(import('@fastify/rate-limit'), {
        global: false,
        max: 3000,
        errorResponseBuilder: (request, context) => ({
            statusCode: 429,
            message: `You have failed too many login attempts, please try again in ${context.after}`,
        }),
    })
    await fastify.register(import('@fastify/swagger'), {
        openapi: {
            info: {
                title: 'Vite via Nginx',
                version: '0.0.1',
            },
        },
        transform: jsonSchemaTransform,
    })
    await fastify.register(import('@fastify/swagger-ui'), {
        routePrefix: '/documentation',
    })
    await fastify.register(fastifyEnv, {
        schema: {
            type: 'object',
            required: ['PORT', 'HOST'],
            properties: {
                PORT: {
                    type: 'number',
                },
                HOST: {
                    type: 'string',
                },
            },
        },
    })
    fastify.setValidatorCompiler(validatorCompiler)
    fastify.setSerializerCompiler(serializerCompiler)
}
