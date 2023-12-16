import crypto from 'crypto'

export default (string: string): string => {
    const salt: string = crypto.randomBytes(16).toString('hex')
    return crypto.createHash('sha256').update(`${string}${salt}`).digest('hex')
}
