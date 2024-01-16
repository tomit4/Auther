import { describe, it, expect, beforeEach } from 'vitest'
import { getRouter } from 'vue-router-mock'
import { render, screen, fireEvent } from '@testing-library/vue'

import { mount } from '@vue/test-utils'
import SignUp from '../views/SignUpView.vue'

describe('SignUp', () => {
    beforeEach(() => {
        const router = getRouter()
        render(SignUp, {
            global: {
                plugins: [router],
            },
        })
    })
    mount(SignUp)
    it('SignUp renders and interacts as expected', async () => {
        const SubmitBtn = screen.getByText('Submit')
        const emailText = screen.getByLabelText(/email/i)
        const passwordText = screen.getByLabelText(/password/i)
        await fireEvent.update(emailText, process.env.VITE_TEST_EMAIL)
        await fireEvent.update(passwordText, process.env.VITE_TEST_PASSWORD)
        await fireEvent.click(SubmitBtn)
        const resSuccessful = await screen.findByTestId('res-successful')
        const { textContent } = resSuccessful
        expect(textContent).toContain(
            `Your Email Was Successfully Sent to ${process.env.VITE_TEST_EMAIL}`,
        )
    })
})
