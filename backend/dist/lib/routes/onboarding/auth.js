"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Verifies Session Token (shorter lived jwt)
exports.default = (fastify, options, done) => {
    fastify.route({
        method: 'GET',
        url: '/auth',
        onRequest: fastify.authenticate,
        handler: async (request, reply) => {
            /* NOTE: Technically our refresh token might be able to be authenticated within fastify.authenticate().
             * This is essentially akin to HapiJS's authentication "strategies".
             * Within fastify.authenticate(), we could check the refresh token
             * and reissue our session token instead of through a separate refresh route. */
            return fastify.authenticate(request, reply);
        },
    });
    done();
};
