"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (fastify) => {
    // NOTE: using require as import throws overload ts error
    // await fastify.register(import('./onboarding/email'))
    await fastify.register(require('./onboarding/email'));
};
