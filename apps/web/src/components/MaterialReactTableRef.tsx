import MaterialReactTable, { MRT_TableInstance, MaterialReactTableProps } from 'material-react-table';
import { ForwardedRef, forwardRef, useImperativeHandle, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _MaterialReactTableWithRef<T extends Record<string, any>>(
  props: MaterialReactTableProps<T>,
  ref: ForwardedRef<MRT_TableInstance<T>>,
) {
  const _ref = useRef<MRT_TableInstance<T>>(null);
  useImperativeHandle<MRT_TableInstance<T> | null, MRT_TableInstance<T> | null>(ref, () => _ref.current, []);

  return <MaterialReactTable tableInstanceRef={_ref} {...props} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default forwardRef(_MaterialReactTableWithRef) as <T extends Record<string, any>>(
  props: MaterialReactTableProps<T> & { ref?: ForwardedRef<MRT_TableInstance<T>> },
) => ReturnType<typeof _MaterialReactTableWithRef>;
