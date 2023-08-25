import { ForwardRefExoticComponent, RefAttributes, forwardRef } from 'react';
import { NavLink, NavLinkProps, To } from 'react-router-dom';

export type NavLinkComponent = ForwardRefExoticComponent<
  Omit<NavLinkProps, 'to' | 'className'> & {
    className?: string;
    activeClassName?: string;
    pendingClassName?: string;
  } & RefAttributes<HTMLAnchorElement>
>;

export default function NavLinkBase(baseProps: { to: To; 'aria-label': string }) {
  return forwardRef<
    HTMLAnchorElement,
    Omit<NavLinkProps, 'to' | 'className'> & {
      className?: string;
      activeClassName?: string;
      pendingClassName?: string;
    }
  >(function NavLinkBase(props, ref) {
    const { className, activeClassName, pendingClassName, ...rest } = props;
    return (
      <NavLink
        ref={ref}
        to={baseProps.to}
        aria-label={baseProps['aria-label']}
        className={({ isActive, isPending }) =>
          `${className} ${isActive ? activeClassName : ''} ${isPending ? pendingClassName : ''}`
        }
        {...rest}
        role={undefined}
      />
    );
  });
}
