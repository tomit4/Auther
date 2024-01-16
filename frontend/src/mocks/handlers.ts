import { http, HttpResponse } from 'msw'

export const handlers = [
    http.post(process.env.VITE_EMAIL_ROUTE as string, async ({ request }) => {
        // TODO: resolve TS error regarding 'DefaultBodyType'
        // NOTE: probably just needs an extend or union
        const { email } = await request.json()
        return HttpResponse.json({
            ok: true,
            message: `Your Email Was Successfully Sent to ${email}`,
        })
    }),
]
