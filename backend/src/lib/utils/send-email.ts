import 'dotenv/config'
import * as Brevo from '@getbrevo/brevo'

type SendEmail = {
    wasSuccessfull: boolean
    data?: object
    error?: object
}

// TODO: Consider wrapping this as a fastify service plugin/class
// Configuration for Brevo
const apiInstance = new Brevo.TransactionalEmailsApi()
// TS-ERROR: Property 'authentications' is protected and only accessible
// within class 'TransactionalEmailsApi' and its subclasses.
// @ts-ignore
const apiKey: Brevo.ApiKeyAuth = apiInstance.authentications.apiKey
apiKey.apiKey = String(process.env.BREVO_KEY)
const sendSmtpEmail = new Brevo.SendSmtpEmail()

// export default async (email: string, hashedEmail: string): Promise<SendEmail> => {
export default async (email: string): Promise<SendEmail> => {
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
        // link: `${process.env.BREVO_LINK}/verify/${hashedEmail}`,
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
