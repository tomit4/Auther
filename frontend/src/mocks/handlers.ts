import { http, HttpResponse, type DefaultBodyType } from 'msw'

type CustomBodyType = DefaultBodyType & {
    email?: string
}

const emailRoute = import.meta.env.VITE_EMAIL_ROUTE as string
const verifyRoute = import.meta.env.VITE_VERIFY_ROUTE as string
const loginRoute = import.meta.env.VITE_LOGIN_ROUTE as string
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE
const changePasswordAskRoute = import.meta.env
    .VITE_CHANGE_PASSWORD_ASK_ROUTE as string

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
        })
    }),
    // LoginView
    http.post(loginRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message:
                'You have been successfully authenticated! Redirecting you to the app...',
        })
    }),
    // AppView
    http.get(grabUserIdRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message: 'Successfully returned raw email from cache',
            email: process.env.VITE_TEST_EMAIL,
        })
    }),
    http.get(logoutRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message: 'logged out',
        })
    }),
    http.post(changePasswordAskRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message:
                'Your password is authenticated, please answer your email to continue change of password',
        })
    }),
]
