import 'dotenv/config'
import * as Brevo from '@getbrevo/brevo'
import { TransactionalEmailsApi } from '@getbrevo/brevo'

// TODO: Consider wrapping this as a fastify service plugin/class

// Configuration for Brevo
const apiInstance: TransactionalEmailsApi = new Brevo.TransactionalEmailsApi()
// TODO: Address this once you know more TS
/* TS-IGNORE: Property 'authentications' is protected and only accessible
 * within class 'TransactionalEmailsApi' and its subclasses. */
// @ts-ignore
const apiKey = apiInstance.authentications.apiKey
apiKey.apiKey = String(process.env.BREVO_KEY)
const sendSmtpEmail = new Brevo.SendSmtpEmail()

// Interfaces
type SendEmail = {
    wasSuccessfull: boolean
    data?: object
    error?: object
}

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
