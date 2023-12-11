"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { FastifyInstance, FastifyPluginCallback } from 'fastify'
// import emailRoute from './onboarding/email'
exports.default = async (fastify) => {
    // await fastify.register(emailRoute, { prefix: '/onboarding' })
    // NOTE: using require as import throws overload ts error
    await fastify.register(require('./onboarding/email'), {
        prefix: '/onboarding',
    });
};
