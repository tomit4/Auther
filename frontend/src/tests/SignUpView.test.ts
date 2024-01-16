import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'

import SignUp from '../views/SignUpView.vue'

// TODO: add test to validate error handling/message
describe('SignUp', () => {
    it('SignUp renders and interacts as expected', async () => {
        render(SignUp)
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
