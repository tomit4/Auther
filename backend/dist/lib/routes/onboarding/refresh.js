"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Verifies Refresh Token (longer lived jwt)
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/refresh',
        schema: {
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                    sessionToken: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { jwt } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            if (refreshToken) {
                const refreshTokenIsValid = jwt.verify(refreshToken);
                if (typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid) {
                    const hashedEmail = refreshTokenIsValid.email;
                    const sessionToken = jwt.sign({ email: hashedEmail }, { expiresIn: process.env.JWT_SESSION_EXP });
                    return reply.code(200).send({
                        ok: true,
                        msg: 'Successfully refreshed session.',
                        sessionToken: sessionToken,
                    });
                }
            }
            return reply.code(500).send({
                ok: false,
                error: 'Invalid refresh token. Redirecting to home...',
            });
        },
    });
    done();
};
