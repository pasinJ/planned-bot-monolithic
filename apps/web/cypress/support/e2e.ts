// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
// Import commands.js using ES2015 syntax:
import { anyPass, is, last, test } from 'ramda';

import './commands';

const regExpEscape = (s: string) => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const wildcardToRegExp = (s: string) => new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*'));

Cypress.on('log:added', (attr) => {
  const { displayName, url } = attr;
  const { blockHosts } = Cypress.config();

  const regexList = is(String, blockHosts)
    ? [wildcardToRegExp(blockHosts)]
    : Array.isArray(blockHosts)
    ? blockHosts.map(wildcardToRegExp)
    : [];
  const isMatchAnyBlockHosts = anyPass(regexList.map((regex) => test(regex)));

  if (displayName === 'xhr' && is(String, url) && isMatchAnyBlockHosts(url)) {
    const element: Element | undefined = window.top?.document
      ? last(Array.from(window.top.document.querySelectorAll('.command-wrapper')))
      : undefined;
    if (element?.parentElement) element.parentElement.style.display = 'none';
  }
});
