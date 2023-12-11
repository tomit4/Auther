"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = async (fastify) => {
    await fastify.register(require('@fastify/cors'));
};
