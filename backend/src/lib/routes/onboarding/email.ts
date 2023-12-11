import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
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
    fastify.route({
        method: 'POST',
        url: '/email',
        // add validation schema, see:
        // https://fastify.dev/docs/latest/Reference/TypeScript/#json-schema
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<PostEmail> => {
            const input = request.body
            const schema = z.object({
                email: z.string().email(),
            })
            try {
                // TODO: Consider wrapping this with sendEmail in a fastify
                // service/class
                const inputIsValid = schema.safeParse({ email: input })
                if (!inputIsValid.success)
                    throw new Error(`ERROR :=> ${inputIsValid.error}`)
                const emailSent = await sendEmail(String(input))
                if (!emailSent.wasSuccessfull)
                    throw new Error(`ERROR :=> ${emailSent.error}`)
            } catch (err) {
                return reply.code(400).send({
                    ok: false,
                    error: `${input} is not a valid email`,
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
