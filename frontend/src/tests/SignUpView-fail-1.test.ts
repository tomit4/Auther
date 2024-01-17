import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'

import SignUp from '../views/SignUpView.vue'

describe('SignUp', () => {
    it('SignUp renders and displays err message on bad email input', async () => {
        render(SignUp)
        const SubmitBtn = screen.getByText('Submit')
        const emailText = screen.getByLabelText(/email/i)
        const passwordText = screen.getByLabelText(/password/i)
        await fireEvent.update(emailText, 'notanemail')
        await fireEvent.update(passwordText, process.env.VITE_TEST_PASSWORD)
        await fireEvent.click(SubmitBtn)
        const errMessage = await screen.findByTestId('err-message')
        const { textContent } = errMessage
        expect(textContent).toContain('Invalid email')
    })
})
