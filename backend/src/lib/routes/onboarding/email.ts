import Joi from 'joi'

import sendEmail from '../../utils/send-email'

type PostEmail = {
  ok: boolean
msg?: string
email?: string
    error?: string
}

export default async (fastify, options, done) => {
  await fastify.route({
    method : 'POST',
    url : '/email',
    // add validation schema, see:
    // https://fastify.dev/docs/latest/Reference/TypeScript/#json-schema
    handler : async(request, reply) : Promise<PostEmail> => {
      const input = request.body
      const schema = Joi.object({
        email : Joi.string().email(),
      })
      try {
        const inputIsValid =
            schema.validate({email : input}).error ? false : true
        if (!inputIsValid) {
          const validationErr =
              schema.validate({email : input}).error?.details[0]?.message
          throw new Error(validationErr)
        }
        const emailSent = await sendEmail(String(input))
        if (!emailSent.wasSuccessfull)
        console.error('ERROR :=>', emailSent.error)
      } catch (err) {
        return reply.send({
          ok : false,
          error : `${input} is not a valid email`,
        })
      }
      return reply.send({
        ok : true,
        msg : `Email sent to ${input}`,
        email : String(input),
      })
    },
  })
done()
