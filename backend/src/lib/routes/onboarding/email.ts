import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import sendEmail from '../../utils/send-email'

type PostEmail = {
    ok: boolean
    msg?: string
    email?: string
    error?: string
}

export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/email',
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
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<PostEmail> => {
            const input = request.body
            try {
                const emailSent = await sendEmail(String(input))
                if (!emailSent.wasSuccessfull)
                    throw new Error(`ERROR :=> ${emailSent.error}`)
            } catch (err) {
                return reply.code(400).send({
                    ok: false,
                    error: `Something went wrong: ${err}`,
                })
            }
            return reply.code(200).send({
                ok: true,
                msg: `Email sent to ${input}`,
                email: String(input),
            })
        },
    })
    done()
}
