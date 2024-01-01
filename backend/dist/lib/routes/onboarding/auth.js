"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Verifies Session Token (shorter lived jwt)
exports.default = (fastify, options, done) => {
    fastify.route({
        method: 'GET',
        url: '/auth',
        onRequest: fastify.authenticate,
        handler: async () => { },
    });
    done();
};
