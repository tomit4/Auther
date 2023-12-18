"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { z } from 'zod'
/*
type BodyReq = {
    email: string
    password: string
}

type SignUpRes = {
    ok: boolean
    msg?: string
    email?: string
    error?: string
}
*/
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/login',
        /*
        schema: {
            body: z.object({
                email: z.string(),
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string().optional(),
                    email: z.string().optional(),
                    error: z.string().optional(),
                }),
                400: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        */
        handler: async (
        // request: FastifyRequest<{ Body: BodyReq }>,
        request, reply) => {
            console.log('hit login route :=>');
        },
    });
    done();
};
