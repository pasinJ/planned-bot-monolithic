import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { path } from 'ramda';

import { byRole } from '#test-utils/selector';

import { IntegerField } from './IntegerField';

function renderComponent(options?: { value?: string; onChange?: () => void; onBlur?: () => void }) {
  return render(<IntegerField value="" {...options} />);
}

const ui = {
  field: byRole('textbox'),
};

describe('GIVEN parent component passed onChange function to the component WHEN a change event happen', () => {
  it('THEN it should call the passed onChange function with parsed value', async () => {
    let targetValue = undefined;
    const onChangeSpy = jest.fn().mockImplementation((e) => {
      targetValue = path(['target', 'value'], e);
    });
    renderComponent({ onChange: onChangeSpy });

    const value = faker.string.alpha(1);
    const user = userEvent.setup();
    await user.type(ui.field.get(), value);

    expect(onChangeSpy).toHaveBeenCalledOnce();
    expect(targetValue).toBe('');
  });
});

describe('GIVEN parent component passed onBlur function to the component WHEN a blur event happen', () => {
  it('THEN it should call the passed onBlur function with parsed value', async () => {
    let targetValue = undefined;
    const onBlurSpy = jest.fn().mockImplementation((e) => {
      targetValue = path(['target', 'value'], e);
    });
    renderComponent({ value: '01', onBlur: onBlurSpy });

    const user = userEvent.setup();
    await user.click(ui.field.get());
    await user.click(document.body);

    expect(onBlurSpy).toHaveBeenCalledOnce();
    expect(targetValue).toBe('1');
  });
});
