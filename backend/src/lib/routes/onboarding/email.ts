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
            body: z.string(),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string().optional(),
                    email: z.string().optional(),
                    error: z.string().optional(),
                }),
            },
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            // ): Promise<PostEmail> => {
            const { email, password } = JSON.parse(String(request.body))
            console.log('password :=>', password)
            const emailSchema = z.string().email()
            try {
                const zParsedEmail = emailSchema.safeParse(email)
                const { success } = zParsedEmail
                if (!success) {
                    const { error } = zParsedEmail
                    throw new Error(String(error.issues[0].message))
                }
                const emailSent = await sendEmail(String(email))
                if (!emailSent.wasSuccessfull)
                    throw new Error(String(emailSent.error))
            } catch (err) {
                if (err instanceof Error) {
                    return reply.code(400).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            return reply.code(200).send({
                ok: true,
                msg: `Email sent to ${email}`,
                email: String(email),
            })
        },
    })
    done()
}
