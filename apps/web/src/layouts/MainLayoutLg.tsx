import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { MouseEventHandler, PropsWithChildren, useState } from 'react';

import logo from '#assets/favicon-64x64.png';
import MaterialSymbol from '#components/MaterialSymbol';
import { NavLinkComponent } from '#routes/components/NavLinkBase';
import { BacktestMainPageLink } from '#routes/components/pageLinks';
import ThemeSwitch from '#styles/containers/ThemeSwitch';

export default function MainLayoutLg({ children }: PropsWithChildren) {
  return (
    <div className="flex max-w-full">
      <SideNav />
      <main className="relative min-h-screen min-w-0 flex-grow bg-gray-100 px-10 py-6 dark:bg-background">
        {children}
      </main>
    </div>
  );
}

function SideNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => setIsOpen((prevState) => !prevState);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const drawerCommonClassName = `bg-surface-1 flex overflow-x-hidden transition-width text-textColor-onPrimary`;
  const drawerClosedClassName = 'w-20 whitespace-nowrap';
  const paperClassName = isOpen
    ? `w-60 shadow-8 duration-muiEnter ease-sharp ${drawerCommonClassName}`
    : `shadow-4 duration-muiLeave ease-sharp ${drawerCommonClassName} ${drawerClosedClassName}`;

  return (
    <Drawer
      variant="permanent"
      className={drawerClosedClassName}
      onMouseEnter={openDrawer}
      onMouseLeave={closeDrawer}
      PaperProps={{ className: paperClassName }}
    >
      <Box className="flex h-full flex-col">
        <DrawerHeader isOpen={isOpen} />
        <Divider />
        <DrawerBody isOpen={isOpen} />
        <DrawerFooter isOpen={isOpen} toggleDrawer={toggleDrawer} />
      </Box>
    </Drawer>
  );
}

function DrawerHeader({ isOpen }: { isOpen: boolean }) {
  return (
    <Box className="flex items-center space-x-5 py-4 pl-4">
      <img src={logo} alt="service logo" className="w-12" />
      <Typography variant="h4" className={isOpen ? 'opacity-100' : 'opacity-0'}>
        Planned
      </Typography>
    </Box>
  );
}

function DrawerBody({ isOpen }: { isOpen: boolean }) {
  return (
    <List className="flex-grow p-0" component="nav">
      <SideNavItemButton
        isOpen={isOpen}
        symbol="youtube_searched_for"
        text="Backtesting"
        navLinkComponent={BacktestMainPageLink}
      />
    </List>
  );
}

function DrawerFooter({ isOpen, toggleDrawer }: { isOpen: boolean; toggleDrawer: MouseEventHandler }) {
  return (
    <Box className="flex flex-col items-center pb-1">
      <Divider className="w-full bg-gray-200 dark:bg-gray-500" variant="middle" />
      <Box className={`flex w-full items-center px-3 py-1 ${isOpen ? 'justify-between' : 'justify-start'}`}>
        <IconButton
          aria-label="toggle drawer"
          className="hoverable:hidden"
          color="inherit"
          onClick={toggleDrawer}
        >
          {isOpen ? (
            <MaterialSymbol symbol="chevron_left" className="text-3xl" />
          ) : (
            <MaterialSymbol symbol="chevron_right" className="text-3xl" />
          )}
        </IconButton>
        <ThemeSwitch className={isOpen ? 'flex' : 'hidden hoverable:flex'} />
      </Box>
    </Box>
  );
}

function SideNavItemButton(props: {
  isOpen: boolean;
  navLinkComponent: NavLinkComponent;
  symbol: string;
  text: string;
}) {
  const { isOpen, symbol, text, navLinkComponent } = props;

  return (
    <ListItemButton
      component={navLinkComponent}
      className="hover:bg-surface-3 hover:text-primary-light"
      activeClassName="text-primary bg-surface-5"
    >
      <ListItemIcon className="text-inherit">
        <MaterialSymbol symbol={symbol} className="pb-1 pl-1.5 text-4xl" />
      </ListItemIcon>
      <ListItemText className={`${isOpen ? 'opacity-100' : 'opacity-0'}`}>{text}</ListItemText>
    </ListItemButton>
  );
}
