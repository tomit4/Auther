/* v8 ignore next 35 */
const authRoute = import.meta.env.VITE_AUTH_ROUTE
const refreshRoute = import.meta.env.VITE_REFRESH_ROUTE
const logoutRoute = import.meta.env.VITE_LOGOUT_ROUTE
const invalidTokenCode = import.meta.env.VITE_INVALID_TOKEN_CODE

const authorizeSession = async (sessionToken: string): Promise<Response> => {
    return await fetch(authRoute, {
        method: 'GET',
        headers: { Authorization: `Bearer ${sessionToken}` },
    })
}

const attemptRefresh = async (): Promise<
    Response & { statusCode?: number; sessionToken?: string; code?: number }
> => {
    const refreshCheck = await fetch(refreshRoute, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    })
    return refreshCheck.json()
}

const logout = async (): Promise<void> => {
    const logOutRes = (await fetch(logoutRoute, {
        method: 'GET',
        credentials: 'include',
    })) as Response & { code?: number }
    if (!logOutRes.ok && logOutRes.code !== invalidTokenCode)
        console.error('ERROR while logging out :=>', logOutRes)
    localStorage.removeItem('appname-session-token')
}

export { authorizeSession, attemptRefresh, logout }
