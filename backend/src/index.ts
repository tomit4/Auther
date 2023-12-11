import Fastify from 'fastify'
import Joi from 'joi'
import 'dotenv/config'
import sendEmail from './utils/send-email'
const fastify = Fastify({ logger: true })

// Plugins
const registerPlugins = async () => {
    await fastify.register(import('@fastify/cors'), {})
}

type PostEmail = {
    ok: boolean
    msg?: string
    email?: string
    error?: string
}

fastify.post('/email', async (request, reply): Promise<PostEmail> => {
    const input = request.body
    const schema = Joi.object({
        email: Joi.string().email(),
    })
    try {
        const inputIsValid = schema.validate({ email: input }).error
            ? false
            : true
        if (!inputIsValid) {
            const validationErr = schema.validate({ email: input }).error
                ?.details[0]?.message
            throw new Error(validationErr)
        }
        const emailSent = await sendEmail(String(input))
        if (!emailSent.wasSuccessfull)
            console.error('ERROR :=>', emailSent.error)
    } catch (err) {
        return reply.send({
            ok: false,
            error: `${input} is not a valid email`,
        })
    }
    return reply.send({
        ok: true,
        msg: `Email sent to ${input}`,
        email: String(input),
    })
})

const start = async (): Promise<void> => {
    try {
        await registerPlugins()
        await fastify.listen({
            port: Number(process.env.PORT),
            host: String(process.env.HOST),
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
