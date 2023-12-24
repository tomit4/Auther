"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Verifies Session Token (shorter lived jwt)
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/auth',
        onRequest: fastify.authenticate,
        schema: {
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            return reply.code(200).send({
                ok: true,
                msg: 'authenticated',
            });
        },
    });
    done();
};
