import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function findDropdownButton(container: HTMLElement | typeof screen = screen) {
  return container instanceof HTMLElement
    ? await within(container).findByRole('button', { name: /open/i })
    : await container.findByRole('button', { name: /open/i });
}

export async function clickAutoCompleteDropdown(
  autoCompleteLabel: string | RegExp,
  container: HTMLElement | typeof screen = screen,
  user = userEvent.setup(),
) {
  const autoComplete =
    container instanceof HTMLElement
      ? (await within(container).findByLabelText(autoCompleteLabel)).parentElement
      : (await container.findByLabelText(autoCompleteLabel)).parentElement;

  if (!autoComplete) throw Error('Cannot find autoComplete element');

  const dropdownButton = await findDropdownButton(autoComplete);

  await user.click(dropdownButton);
}

export async function selectOptionAutoComplete(
  autoCompleteLabel: string | RegExp,
  value: string,
  container: HTMLElement | typeof screen = screen,
  user = userEvent.setup(),
) {
  await clickAutoCompleteDropdown(autoCompleteLabel, container, user);

  const optionsList = await screen.findByRole('listbox', { name: autoCompleteLabel });
  await user.selectOptions(optionsList, value);
}
