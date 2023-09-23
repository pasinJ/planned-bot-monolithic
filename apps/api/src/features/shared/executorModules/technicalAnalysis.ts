export type TechnicalAnalysisModule = {
  crossover: (source: number[]) => boolean;
  crossunder: (source: number[]) => boolean;
  falling: (source: number[], period: number) => boolean;
  rising: (source: number[], period: number) => boolean;
  highest: (source: number[], period: number) => boolean;
  lowest: (source: number[], period: number) => boolean;
  momentum: (source: number[], period: number) => boolean;
};

// crossover : if, on the current bar, the value of `source1` is greater than the value of `source2`, and on the previous bar, the value of `source1` was less than or equal to the value of `source2`.
// crossunder : if, on the current bar, the value of `source1` is less than the value of `source2`, and on the previous bar, the value of `source1` was greater than or equal to the value of `source2`.
// falling : true if current `source` value is less than any previous `source` value for `length` bars back, false otherwise.
// highest : Highest value for a given number of bars back.
// lowest : Lowest value for a given number of bars back.
// momentum : Momentum of `source` price and `source` price `length` bars ago.
// rising : true if current `source` is greater than any previous `source` for `length` bars back, false otherwise.
