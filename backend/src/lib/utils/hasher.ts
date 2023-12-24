import 'dotenv/config'
import crypto from 'crypto'

export default (string: string): string => {
    return crypto
        .createHmac('sha256', process.env.HASH_SALT as string)
        .update(string)
        .digest('hex')
}
