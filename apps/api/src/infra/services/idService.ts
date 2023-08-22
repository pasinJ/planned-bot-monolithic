import { nanoid } from 'nanoid';

import { SymbolId } from '#features/symbols/domain/symbol.entity.js';

import { IdService } from './idService.type.js';

export const idService: IdService = { generateSymbolId: () => nanoid() as SymbolId };
