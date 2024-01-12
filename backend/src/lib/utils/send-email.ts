import 'dotenv/config'
import * as Brevo from '@getbrevo/brevo'

type SendEmail = {
    wasSuccessfull: boolean
    data?: object
    error?: object
}

// Configuration for Brevo
const apiInstance = new Brevo.TransactionalEmailsApi()
// ISSUE: https://github.com/getbrevo/brevo-node/issues/1
// TS-ERROR: Property 'authentications' is protected and only accessible
// within class 'TransactionalEmailsApi' and its subclasses.
// @ts-ignore
const apiKey: Brevo.ApiKeyAuth = apiInstance.authentications.apiKey
apiKey.apiKey = process.env.BREVO_KEY as string
const sendSmtpEmail = new Brevo.SendSmtpEmail()

export default async (
    email: string,
    endpoint: string,
    templateId: number,
): Promise<SendEmail> => {
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
    sendSmtpEmail.templateId = Number(templateId)
    sendSmtpEmail.params = {
        // NOTE: verify must also change based off of sign up, change password, or delete
        link: `${process.env.BREVO_LINK}/${endpoint}`,
    }
    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
        return { wasSuccessfull: true, data: data }
    } catch (err) {
        throw new Error(`ERROR :=>, ${err}`)
    }
}
