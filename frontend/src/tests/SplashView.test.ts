import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import SplashView from '../views/SplashView.vue'

describe('SplashView', () => {
    it('renders and interacts properly', async () => {
        const wrapper = mount(SplashView)
        const h1 = wrapper.get('[data-test="h1"]')
        const signupBtn = wrapper.get('[data-test="signup-btn"]')
        const loginBtn = wrapper.get('[data-test="login-btn"]')
        await wrapper.get('[data-test="signup-btn"]').trigger('click')
        await wrapper.get('[data-test="login-btn"]').trigger('click')
        expect(h1.text()).toContain('Splash')
        expect(signupBtn.text()).toContain('Sign Up')
        expect(loginBtn.text()).toContain('Login')
    })
})
