import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { path } from 'ramda';

import { DecimalField } from './DecimalField';

function renderComponent(options?: { value?: string; onChange?: () => void; onBlur?: () => void }) {
  return render(<DecimalField value="" {...options} />);
}

describe('GIVEN parent component passed onChange function to the component WHEN onChange event happen', () => {
  it('THEN it should call the passed onChange function with parsed value', async () => {
    let targetValue = undefined;
    const onChangeSpy = jest.fn().mockImplementation((e) => {
      targetValue = path(['target', 'value'], e);
    });
    renderComponent({ onChange: onChangeSpy });

    const value = faker.string.alpha(1);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), value);

    expect(onChangeSpy).toHaveBeenCalledOnce();
    expect(targetValue).toEqual('');
  });
});

describe('GIVEN parent component passed onBlur function to the component WHEN onBlur event happen', () => {
  it('THEN it should call the passed onBlur function with parsed value', async () => {
    let targetValue = undefined;
    const onBlurSpy = jest.fn().mockImplementation((e) => {
      targetValue = path(['target', 'value'], e);
    });
    renderComponent({ value: '1.', onBlur: onBlurSpy });

    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox'));
    await user.click(document.body);

    expect(onBlurSpy).toHaveBeenCalledOnce();
    expect(targetValue).toEqual('1.0');
  });
});
