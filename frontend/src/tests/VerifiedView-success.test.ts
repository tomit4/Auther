import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import Verified from '../views/VerifiedView.vue'

describe('Verified', () => {
    it('Verified renders and verifies as expected', async () => {
        const wrapper = mount(Verified)
        await flushPromises()
        const h1 = wrapper.get('[data-test="h1"]')
        const h2 = wrapper.get('[data-test="h2"]')
        const errMessage = wrapper.find('[data-test="err-message"]')
        const resSuccessful = wrapper.get('[data-test="res-successful"]')
        expect(h1.text()).toContain('Thanks For Answering Our Email,')
        expect(h2.text()).toContain('please wait while we verify...')
        expect(errMessage.exists()).toBe(false)
        expect(resSuccessful.text()).toContain(
            'Your email has been verified, redirecting you to the app...',
        )
    })
})
