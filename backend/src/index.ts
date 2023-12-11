import Fastify from 'fastify'
import Joi from 'joi'
import 'dotenv/config'
import * as Brevo from '@getbrevo/brevo'
const fastify = Fastify({ logger: true })

// Configuration for Brevo
const apiInstance = new Brevo.TransactionalEmailsApi()
/* TS-IGNORE: Property 'authentications' is protected and only accessible
 * within class 'TransactionalEmailsApi' and its subclasses. */
// @ts-ignore
const apiKey = apiInstance.authentications.apiKey
apiKey.apiKey = String(process.env.BREVO_KEY)
const sendSmtpEmail = new Brevo.SendSmtpEmail()

const sendEmail = async (
    email: string,
): Promise<{ wasSuccessfull: boolean; data?: object; error?: object }> => {
    sendSmtpEmail.sender = {
        name: 'My Test Company',
        email: 'mytestemail@email.com',
    }
    sendSmtpEmail.subject = 'My Test Company'
    sendSmtpEmail.to = [
        {
            email: email,
        },
    ]
    sendSmtpEmail.templateId = Number(process.env.BREVO_TEMPLATE_ID)
    sendSmtpEmail.params = {
        link: `${process.env.BREVO_LINK}/verify`,
    }
    return await apiInstance.sendTransacEmail(sendSmtpEmail).then(
        data => {
            console.log('data :=>', data)
            return { wasSuccessfull: true, data: data }
        },
        error => {
            return { wasSuccessfull: false, error: error }
        },
    )
}

fastify.post(
    '/email',
    async (
        request,
        reply,
    ): Promise<{
        ok: boolean
        msg?: string
        email?: string
        error?: string
    }> => {
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
    },
)

const start = async (): Promise<void> => {
    try {
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
