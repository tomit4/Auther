"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Logs Out User/Removes Refresh Token via HTTPS Cookie with maxAge=0
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/logout',
        schema: {
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            return reply
                .code(200)
                .clearCookie('appname-refresh-token', { path: '/onboarding' })
                .send({
                ok: true,
                msg: 'logged out',
            });
        },
    });
    done();
};
