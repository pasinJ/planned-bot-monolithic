import tailwindMerge from '#utils/twMerge';

type MaterialSymbolProps = { symbol: string; className?: string };

export default function MaterialSymbol({ symbol, className }: MaterialSymbolProps) {
  const symbolClassName = 'material-symbols-rounded';
  return (
    <span aria-hidden="true" className={tailwindMerge(className, symbolClassName)}>
      {symbol}
    </span>
  );
}
