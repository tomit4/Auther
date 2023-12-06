const Hapi = require('@hapi/hapi')
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
            console.log('req.payload :=>', req.payload)
            return { msg: 'Hello World!' }
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
