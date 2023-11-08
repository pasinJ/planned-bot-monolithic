import { mergeClassName } from '#shared/utils/tailwind';

type MaterialSymbolProps = { symbol: string; className?: string };

export default function MaterialSymbol({ symbol, className }: MaterialSymbolProps) {
  const symbolClassName = 'material-symbols-rounded';
  return (
    <span aria-hidden="true" className={mergeClassName(className, symbolClassName)}>
      {symbol}
    </span>
  );
}
