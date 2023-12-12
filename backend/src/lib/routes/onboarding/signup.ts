import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
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

export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
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
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                /* TODO: set up knex and mariadb
                 * auth table with hashed email and
                 * hashed key with object that has jwt in it (reddis cache?)
                 */

                // TODO: establish jwt here
                // TODO: hash email
                // TODO: hash token
                // TODO: store token in cache/redis
                console.log('request.body :=>', request.body)
                const token = fastify.jwt.sign({ payload: request.body })
                console.log('token :=>', token)
                reply.code(200).send({ token })
            } catch (err) {
                console.error('ERROR :=>', err)
                reply.code(400).send({ err_msg: err })
            }
        },
    })
    done()
}
