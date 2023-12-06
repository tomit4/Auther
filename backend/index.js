const Hapi = require('@hapi/hapi')
const Joi = require('joi')

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
    })

    server.route({
        method: 'GET',
        path: '/',
        handler: (req, h) => {
            return { msg: 'Hello World!' }
        },
    })

    server.route({
        method: 'POST',
        path: '/email',
        handler: (req, h) => {
            const input = req.payload
            const schema = Joi.object({
                email: Joi.string().email(),
            })
            try {
                const inputIsValid = schema.validate({ email: input }).error
                    ? false
                    : true
                if (!inputIsValid) throw new Error(validate.error)
            } catch (err) {
                return { error: `${input} is not a valid email` }
            }
            // TODO: respond with hashed json web token
            // to be assigned to front end cookie string
            return { msg: `received input: ${input}` }
        },
    })

    await server.start()
    console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', err => {
    console.log(err)
    process.exit(1)
})

init()
