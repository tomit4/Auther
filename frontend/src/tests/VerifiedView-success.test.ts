import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'

import Verified from '../views/VerifiedView.vue'

describe('Verified', () => {
    it('Verified renders and verifies as expected', async () => {
        const { queryByTestId } = render(Verified)
        await flushPromises()
        const h1 = queryByTestId('h1') as HTMLElement
        const h2 = queryByTestId('h2') as HTMLElement
        const errMessage = queryByTestId('err-message') as HTMLElement
        const resSuccessful = queryByTestId('res-successful') as HTMLElement
        expect(h1.textContent).toContain('Thanks For Answering Our Email,')
        expect(h2.textContent).toContain('please wait while we verify...')
        expect(errMessage).toBeNull()
        expect(resSuccessful.textContent).toContain(
            'Your email has been verified, redirecting you to the app...',
        )
    })
})
