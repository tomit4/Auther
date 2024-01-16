import { http, HttpResponse } from 'msw'

export const handlers = [
    http.post(
        'http://localhost:3000/onboarding/signup',
        async ({ request }) => {
            const { email } = await request.json()
            return HttpResponse.json({
                ok: true,
                message: `Your Email Was Successfully Sent to ${email}`,
            })
        },
    ),
]
