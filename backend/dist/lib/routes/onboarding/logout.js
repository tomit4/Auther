"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Logs Out User/Removes Refresh Token via HTTPS Cookie with maxAge=0
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/logout',
        /*
        schema: {
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                }),
                500: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        */
        handler: async (request, reply) => {
            const { redis, jwt } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            // TODO: Definitely Refactor this with try/catch/throw, too nested...
            if (refreshToken) {
                const refreshTokenIsValid = jwt.verify(refreshToken);
                if (typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid) {
                    const hashedEmail = refreshTokenIsValid.email;
                    await redis.del(`${hashedEmail}-refresh-token`);
                }
            }
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
