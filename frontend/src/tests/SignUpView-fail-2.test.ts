import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'

import SignUp from '../views/SignUpView.vue'

describe('SignUp', () => {
    it('SignUp renders and displays err message on bad password input', async () => {
        render(SignUp)
        const SubmitBtn = screen.getByText('Submit')
        const emailText = screen.getByLabelText(/email/i)
        const passwordText = screen.getByLabelText(/password/i)
        await fireEvent.update(emailText, process.env.VITE_TEST_EMAIL)
        await fireEvent.update(passwordText, 'notavalidpassword')
        await fireEvent.click(SubmitBtn)
        const errMessage = await screen.findByTestId('err-message')
        const { textContent } = errMessage
        expect(textContent).toContain(
            'Password must be at least 10 characters in length and contain at \
                least one lowercase letter, one uppercase letter, one digit, and one \
                special character',
        )
    })
})
