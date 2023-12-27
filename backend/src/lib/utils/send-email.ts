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
// ISSUE: https://github.com/getbrevo/brevo-node/issues/1
// TS-ERROR: Property 'authentications' is protected and only accessible
// within class 'TransactionalEmailsApi' and its subclasses.
// @ts-ignore
const apiKey: Brevo.ApiKeyAuth = apiInstance.authentications.apiKey
apiKey.apiKey = process.env.BREVO_KEY as string
const sendSmtpEmail = new Brevo.SendSmtpEmail()

export default async (email: string, endpoint: string): Promise<SendEmail> => {
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
        // NOTE: verify must also change based off of sign up, change password, or delete
        link: `${process.env.BREVO_LINK}/${endpoint}`,
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
