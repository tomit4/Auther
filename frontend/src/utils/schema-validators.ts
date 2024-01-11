import { z } from 'zod'
import { passwordSchemaRegex, passwordSchemaErrMsg } from '../schemas/password'

const emailSchema = z.string().email()
const passwordSchema = z.string().regex(passwordSchemaRegex, {
    message: passwordSchemaErrMsg,
})

const validateInputSchemas = (
    emailInput: string,
    passwordInput: string,
): void => {
    const zParsedEmail = emailSchema.safeParse(emailInput)
    const zParsedPassword = passwordSchema.safeParse(passwordInput)
    if (zParsedEmail.success === false) {
        const { error } = zParsedEmail
        throw new Error(error.issues[0].message as string)
    }
    if (zParsedPassword.success === false) {
        const { error } = zParsedPassword
        throw new Error(error.issues[0].message as string)
    }
}

export { validateInputSchemas }
