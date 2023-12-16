import 'dotenv/config'
import crypto from 'crypto'

export default (string: string): string => {
    return crypto
        .createHmac('sha256', String(process.env.HASH_SALT))
        .update(string)
        .digest('hex')
}
