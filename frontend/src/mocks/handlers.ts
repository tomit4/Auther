import { http, HttpResponse, type DefaultBodyType } from 'msw'

type CustomBodyType = DefaultBodyType & {
    email?: string
}

const emailRoute = import.meta.env.VITE_EMAIL_ROUTE
const verifyRoute = import.meta.env.VITE_VERIFY_ROUTE
const loginRoute = import.meta.env.VITE_LOGIN_ROUTE
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const grabUserIdRoute = import.meta.env.VITE_USERID_ROUTE
const changePasswordAskRoute = import.meta.env.VITE_CHANGE_PASSWORD_ASK_ROUTE
const deleteProfileAskRoute = import.meta.env.VITE_DELETE_PROFILE_ASK_ROUTE
const forgotPassAskRoute = import.meta.env.VITE_FORGOT_PASS_ASK_ROUTE
const changePasswordRoute = import.meta.env.VITE_CHANGE_PASSWORD_ROUTE
const deleteProfileRoute = import.meta.env.VITE_DELETE_PROFILE_ROUTE
const forgotPasswordCheckRoute = import.meta.env.VITE_FORGOT_PASS_CHECK_ROUTE
const forgotPasswordChangeRoute = import.meta.env.VITE_FORGOT_PASS_CHANGE_ROUTE

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
    // ChangePassForm
    http.post(changePasswordAskRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message:
                'Your password is authenticated, please answer your email to continue change of password',
        })
    }),
    // DeleteProfileForm
    http.post(deleteProfileAskRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message:
                'You have successfully requested to delete your profile, please check your email',
        })
    }),
    // ForgotPasswordView
    http.post(forgotPassAskRoute, async ({ request }) => {
        const { email } = (await request.json()) as CustomBodyType
        return HttpResponse.json({
            ok: true,
            message: `Your forgot password request was successfully sent to ${email}!`,
        })
    }),
    // VerifiedChangePasswordView
    http.patch(changePasswordRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message: 'You have successfully changed your password!',
        })
    }),
    // DeleteProfileView
    http.delete(deleteProfileRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message:
                'You have successfully deleted your profile, redirecting you home',
        })
    }),
    // VerifiedForgotPasswordView
    http.post(forgotPasswordCheckRoute, async () => {
        return HttpResponse.json({
            ok: true,
            email: process.env.VITE_TEST_EMAIL,
            message:
                'Hashed Email Verified and Validated, now you can change your password',
        })
    }),
    http.patch(forgotPasswordChangeRoute, async () => {
        return HttpResponse.json({
            ok: true,
            message: 'You have successfully changed your password!',
        })
    }),
]
