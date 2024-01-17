import { http, HttpResponse, type DefaultBodyType } from 'msw'

type CustomBodyType = DefaultBodyType & {
    email?: string
}

export const handlers = [
    http.post(process.env.VITE_EMAIL_ROUTE as string, async ({ request }) => {
        const { email } = (await request.json()) as CustomBodyType
        return HttpResponse.json({
            ok: true,
            message: `Your Email Was Successfully Sent to ${email}`,
        })
    }),
]
