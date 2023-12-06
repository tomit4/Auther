const Hapi = require('@hapi/hapi')
const Joi = require('joi')
require('dotenv').config()

// Configuration for Brevo
const Brevo = require('@getbrevo/brevo')
const apiInstance = new Brevo.TransactionalEmailsApi()
const apiKey = apiInstance.authentications.apiKey
apiKey.apiKey = process.env.BREVO_KEY
const sendSmtpEmail = new Brevo.SendSmtpEmail()

const sendEmail = async email => {
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
            return { wasSuccessfull: true, data: data }
        },
        error => {
            return { wasSuccessfull: false, error: error }
        },
    )
}

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
    })

    server.route({
        method: 'POST',
        path: '/email',
        handler: async (req, h) => {
            const input = req.payload
            const schema = Joi.object({
                email: Joi.string().email(),
            })
            try {
                const inputIsValid = schema.validate({ email: input }).error
                    ? false
                    : true
                if (!inputIsValid) throw new Error(validate.error)
                const emailSent = await sendEmail(input)
                if (!emailSent.wasSuccessfull)
                    console.error('ERROR :=>', emailSent.error)
            } catch (err) {
                return { ok: false, error: `${input} is not a valid email` }
            }
            return { ok: true, msg: `Email sent to ${input}`, email: input }
        },
    })

    await server.start()
    console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', err => {
    console.log(err)
    process.exit(1)
})

init()
