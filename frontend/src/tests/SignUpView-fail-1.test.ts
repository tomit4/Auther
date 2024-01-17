import { describe, it, expect } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

import Focus from '../directives/focus.ts'
import SignUp from '../views/SignUpView.vue'

describe('SignUp', () => {
    it('SignUp renders and displays err message on bad email input', async () => {
        const wrapper = mount(SignUp, {
            global: {
                directives: {
                    Focus: Focus,
                },
                stubs: {
                    RouterLink: RouterLinkStub,
                },
            },
        })
        await wrapper.get('[data-test="email-input"]').setValue('notanemail')
        await wrapper
            .get('[data-test="password-input"]')
            .setValue(process.env.VITE_TEST_PASSWORD)
        await wrapper.get('[data-test="submit-btn"]').trigger('click')
        await flushPromises()
        const errMessage = wrapper.get('[data-test="err-message"]')
        const resSuccessful = wrapper.find('[data-test="res-successful"]')
        expect(resSuccessful.exists()).toBe(false)
        expect(errMessage.text()).toContain('Invalid email')
    })
})
