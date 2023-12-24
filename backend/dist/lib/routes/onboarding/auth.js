"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
type VerifyRes = {
    ok: boolean
    msg?: string
    error?: string
}
*/
// Verifies Session Token (shorter lived jwt)
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/auth',
        // TODO: extend type FastifyInstance to include authenticate...
        onRequest: [fastify.authenticate],
        /*
        schema: {
            body: z.object({
                hashedEmail: z.string(),
            }),
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
            // TODO: extend out try/catch/throw error handling
            // TODO: Send sensitive info to user to be rendered on front end
            return reply.code(200).send({
                ok: true,
                msg: 'authenticated',
            });
        },
    });
    done();
};
