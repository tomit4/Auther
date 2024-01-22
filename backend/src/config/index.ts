import fs from 'node:fs'
import path from 'node:path'
import { type FastifyLoggerOptions } from 'fastify'

type FastifyConfig = {
    https?: {
        key: Buffer
        cert: Buffer
    }
    logger?: FastifyLoggerOptions & {
        transport: {
            target: string
        }
    }
}

const fastifyConfig: FastifyConfig = {
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
}

if (process.env.DEV === 'false') {
    fastifyConfig.https = {
        key: fs.readFileSync(
            path.join(__dirname, '../security/localhost_key.pem'),
        ),
        cert: fs.readFileSync(
            path.join(__dirname, '../security/localhost_cert.pem'),
        ),
    }
}

export default fastifyConfig
