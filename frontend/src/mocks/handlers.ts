import { http, HttpResponse, type DefaultBodyType } from 'msw'

type CustomBodyType = DefaultBodyType & {
    email?: string
}

const emailRoute = import.meta.env.VITE_EMAIL_ROUTE as string
const verifyRoute = import.meta.env.VITE_VERIFY_ROUTE as string

export const handlers = [
    // SignUpView
    http.post(emailRoute, async ({ request }) => {
        const { email } = (await request.json()) as CustomBodyType
        return HttpResponse.json({
            ok: true,
            message: `Your Email Was Successfully Sent to ${email}`,
        })
    }),
    // VerifiedView
    http.post(verifyRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message:
                'Your email has been verified, redirecting you to the app...',
            // sessionToken: sessionToken
        })
    }),
]
