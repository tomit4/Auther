import 'dotenv/config'
import { FastifyInstance } from 'fastify'
import fastifyEnv from '@fastify/env'
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(import('@fastify/cors'))
    await fastify.register(import('@fastify/helmet'))
    await fastify.register(import('@fastify/redis'), {
        host: String(process.env.REDIS_HOST),
        port: Number(process.env.REDIS_PORT),
    })
    await fastify.register(import('@fastify/rate-limit'), {
        max: 100,
        timeWindow: '1 minute',
    })
    await fastify.register(import('@fastify/jwt'), {
        secret: 'replaceme',
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
