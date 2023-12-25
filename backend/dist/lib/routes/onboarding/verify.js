"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/verify',
        schema: {
            body: zod_1.z.object({
                hashedEmail: zod_1.z.string(),
            }),
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
            const { hashedEmail } = request.body;
            const { redis, knex, jwt } = fastify;
            try {
                const redisCacheExpired = (await redis.ttl(`${hashedEmail}-email`)) < 0 ||
                    (await redis.ttl(`${hashedEmail}-password`)) < 0;
                const emailFromRedis = await redis.get(`${hashedEmail}-email`);
                const hashedPasswordFromRedis = await redis.get(`${hashedEmail}-password`);
                const userAlreadyInDb = await knex('users')
                    .where('email', emailFromRedis)
                    .first();
                if (redisCacheExpired)
                    throw new Error('Sorry, but you took too long to answer your email, please sign up again.');
                if (!emailFromRedis || !hashedPasswordFromRedis)
                    throw new Error('No data found by that email address, please sign up again.');
                if (userAlreadyInDb)
                    throw new Error('You have already signed up, please log in.');
                await knex
                    .insert({
                    email: hashedEmail,
                    password: hashedPasswordFromRedis,
                })
                    .into('users');
                await redis.del(`${hashedEmail}-email`);
                await redis.del(`${hashedEmail}-password`);
            }
            catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message);
                    return reply.code(500).send({
                        ok: false,
                        error: err.message,
                    });
                }
            }
            const sessionToken = jwt.sign({ email: hashedEmail }, { expiresIn: process.env.JWT_SESSION_EXP });
            const refreshToken = jwt.sign({ email: hashedEmail }, { expiresIn: process.env.JWT_REFRESH_EXP });
            // TODO: reset expiration to a .env variable
            await redis.set(`${hashedEmail}-session-token`, sessionToken, 'EX', 60);
            return reply
                .code(200)
                .clearCookie('appname-hash', { path: '/verify' })
                .setCookie('appname-refresh-token', refreshToken, {
                secure: true,
                httpOnly: true,
                sameSite: true,
                // maxAge: 3600, // unsure if to use, research
            })
                .send({
                ok: true,
                msg: 'Your email has been verified, redirecting you to the app...',
                sessionToken: sessionToken,
            });
        },
    });
    done();
};
