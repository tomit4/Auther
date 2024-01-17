import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

import AppView from '../views/AppView.vue'

describe('AppView', () => {
    it('AppView renders and interacts as expected', async () => {
        const wrapper = mount(AppView)
        await flushPromises()
        expect(wrapper.text()).toContain(
            `AppWelcome ${process.env.VITE_TEST_EMAIL}!! Log Out  Change Password  Delete My Profile`,
        )
        await wrapper.get('[data-test="logout-btn"]').trigger('click')
        await nextTick()
        await wrapper.get('[data-test="change-password-btn"]').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain(
            `You're about to change the password for ${process.env.VITE_TEST_EMAIL} Enter Your Password:  Submit`,
        )

        await wrapper.get('[data-test="go-back-btn"]').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain(
            `AppWelcome ${process.env.VITE_TEST_EMAIL}!! Log Out  Change Password  Delete My Profile`,
        )
        await wrapper.get('[data-test="delete-profile-btn"]').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain(
            `You're about to delete the profile for ${process.env.VITE_TEST_EMAIL} Enter Your Password:  Submit`,
        )
        await wrapper.get('[data-test="go-back-btn"]').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain(
            `AppWelcome ${process.env.VITE_TEST_EMAIL}!! Log Out  Change Password  Delete My Profile`,
        )
    })
})
