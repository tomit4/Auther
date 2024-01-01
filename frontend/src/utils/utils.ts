const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const grabStoredCookie = (cookieKey: string): string | undefined => {
    const cookies = document.cookie.split('; ').reduce((prev, current) => {
        const [key, ...value] = current.split('=')
        // TODO: consider refactoring this using a Map
        prev[key] = value.join('=')
        return prev
    }, {})
    const cookieVal = cookieKey in cookies ? cookies[cookieKey] : undefined
    return cookieVal
}

export { delay, grabStoredCookie }
