import { useMediaQuery, useTheme } from '@mui/material';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { is } from 'ramda';
import {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { ListChildComponentProps, VariableSizeList } from 'react-window';

import { isString } from '#shared/utils/typeGuards';

const LISTBOX_PADDING = 8; // px

const ListboxComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLElement>>(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData: ReactElement[] = [];
    (children as ReactElement[]).forEach((item: ReactElement & { children?: ReactElement[] }) => {
      itemData.push(item);
      itemData.push(...(item.children ?? []));
    });

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true });
    const itemCount = itemData.length;
    const itemSize = smUp ? 36 : 48;

    const getChildSize = (child: ReactElement) => {
      // eslint-disable-next-line no-prototype-builtins
      if (child.hasOwnProperty('group')) return 48;

      return itemSize;
    };

    const getHeight = () => {
      if (itemCount > 8) return 8 * itemSize;
      else return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
    };

    const gridRef = useResetCache(itemCount);

    return (
      <div ref={ref}>
        <OuterElementContext.Provider value={other}>
          <VariableSizeList
            itemData={itemData}
            height={getHeight() + 2 * LISTBOX_PADDING}
            width="100%"
            ref={gridRef}
            outerElementType={OuterElementType}
            innerElementType="ul"
            itemSize={(index) => {
              const data = itemData.at(index);
              return data ? getChildSize(data) : 0;
            }}
            overscanCount={5}
            itemCount={itemCount}
          >
            {renderRow}
          </VariableSizeList>
        </OuterElementContext.Provider>
      </div>
    );
  },
);

const OuterElementContext = createContext({});

const OuterElementType = forwardRef<HTMLDivElement>(function OuterElementType(props, ref) {
  const outerProps = useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: unknown) {
  const ref = useRef<VariableSizeList>(null);

  useEffect(() => {
    if (ref.current !== null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);

  return ref;
}

function renderRow<T>(props: ListChildComponentProps<T>) {
  const { data, index, style } = props as {
    data: [HTMLAttributes<HTMLLIElement>, string, number][];
    index: number;
    style: CSSProperties;
  };
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, no-prototype-builtins
  if (!isString(dataSet) && !is(Number, dataSet) && 'key' in dataSet && 'group' in dataSet) {
    return (
      <ListSubheader key={dataSet.key as string} component="div" style={inlineStyle}>
        {dataSet.group as ReactElement}
      </ListSubheader>
    );
  }

  return (
    <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
      {dataSet[1]}
    </Typography>
  );
}

export default ListboxComponent;
