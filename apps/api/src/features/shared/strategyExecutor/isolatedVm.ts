import type isolatedVm from 'isolated-vm';
import { createRequire } from 'node:module';

type IsolatedVm = typeof isolatedVm;

const require = createRequire(import.meta.url);
export const ivm = (require('isolated-vm/out/isolated_vm.node') as { ivm: IsolatedVm }).ivm;
