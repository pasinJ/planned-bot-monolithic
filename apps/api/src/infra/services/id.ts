import { nanoid } from 'nanoid';

import { SymbolId } from '#features/symbols/domain/symbol.entity.js';

import { IdService } from './id.type.js';

export const idService: IdService = { generateSymbolId: () => nanoid() as SymbolId };
