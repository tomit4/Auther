import crypto, { HashOptions } from 'crypto'

export default (string: string): string => {
    const salt: HashOptions = crypto.randomBytes(16)
    return crypto.createHash('sha256', salt).update(string).digest('hex')
}
