"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { ZodTypeProvider } from 'fastify-type-provider-zod'
// import { z } from 'zod'
/*
type PostEmail = {
    ok: boolean
    msg?: string
    email?: string
    error?: string
}
*/
exports.default = (fastify, options, done) => {
    // fastify.withTypeProvider<ZodTypeProvider>().route({
    fastify.route({
        method: 'POST',
        url: '/signup',
        /*
        schema: {
            body: z.string().email(),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string().optional(),
                    email: z.string().optional(),
                    error: z.string().optional(),
                }),
            },
        },
        */
        handler: async (request, reply) => {
            try {
                console.log('request.body :=>', request.body);
                const token = fastify.jwt.sign({ payload: request.body });
                console.log('token :=>', token);
                reply.code(200).send({ token });
            }
            catch (err) {
                console.error('ERROR :=>', err);
                reply.code(400).send({ err_msg: err });
            }
        },
    });
    done();
};