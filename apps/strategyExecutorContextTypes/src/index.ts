import "lodash/common/common";
import "lodash/common/array";
import "lodash/common/collection";
import "lodash/common/date";
import "lodash/common/function";
import "lodash/common/lang";
import "lodash/common/math";
import "lodash/common/number";
import "lodash/common/object";
import "lodash/common/seq";
import "lodash/common/string";
import "lodash/common/util";

import type { KlinesModule } from "./KlinesModule.js";
import type { OrdersModule } from "./OrdersModule.js";
import type { TradesModule } from "./TradesModule.js";
import type { StrategyModule } from "./StrategyModule.js";
import type { TechnicalAnalysisModule } from "./TechnicalAnalysisModule.js";
import type { SystemModule } from "./SystemModule.js";
import { LodashModule } from "./LodashModule.js";

declare global {
  var klines: KlinesModule;
  var orders: OrdersModule;
  var trades: TradesModule;
  var strategy: StrategyModule;
  var ta: TechnicalAnalysisModule;
  var system: SystemModule;
  var lodash: LodashModule;
}

export {
  KlinesModule,
  OrdersModule,
  TradesModule,
  StrategyModule,
  TechnicalAnalysisModule,
  SystemModule,
};
