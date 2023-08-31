import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { PropsWithChildren, useState } from 'react';

import logo from '#assets/favicon-64x64.png';
import MaterialSymbol from '#components/MaterialSymbol';
import { NavLinkComponent } from '#routes/components/NavLinkBase';
import { BtPageLink } from '#routes/components/pageLinks';

export default function MainLayoutLg({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen">
      <SideNav />
      <Box component="main" className="h-full w-full">
        <Box className="h-full w-full bg-gray-100 px-10 py-6">{children}</Box>
      </Box>
    </div>
  );
}

function SideNav() {
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => setOpen((prevState) => !prevState);
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const drawerCommonClassName = `bg-surface-1 flex overflow-x-hidden transition-width text-textColor-onPrimary`;
  const drawerClosedClassName = 'w-20 whitespace-nowrap';
  const paperClassName = open
    ? `w-60 shadow-8 duration-muiEnter ease-sharp ${drawerCommonClassName}`
    : `shadow-4 duration-muiLeave ease-sharp ${drawerCommonClassName} ${drawerClosedClassName}`;

  const DrawerHeader = (
    <Box className="flex items-center space-x-5 py-4 pl-4">
      <img src={logo} alt="service logo" className="w-12" />
      <Typography variant="h4" className={open ? 'opacity-100' : 'opacity-0'}>
        Planned
      </Typography>
    </Box>
  );
  const DrawerBody = (
    <List className="h-full" component="nav">
      <SideNavItemButton
        isNavOpening={open}
        symbol="youtube_searched_for"
        text="Backtesting"
        navLinkComponent={BtPageLink}
      />
    </List>
  );
  const DrawerFooter = (
    <Box className="flex flex-col">
      <Divider />
      <Box className={`flex px-3 py-1 ${open ? 'justify-end' : 'justify-center'}`}>
        <IconButton
          aria-label="toggle drawer"
          className="hoverable:hidden"
          color="inherit"
          onClick={handleDrawerToggle}
        >
          {open ? (
            <MaterialSymbol symbol="chevron_left" className="text-3xl" />
          ) : (
            <MaterialSymbol symbol="chevron_right" className="text-3xl" />
          )}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      className={drawerClosedClassName}
      onMouseEnter={handleDrawerOpen}
      onMouseLeave={handleDrawerClose}
      PaperProps={{ className: paperClassName }}
    >
      <Box className="flex h-full flex-col">
        {DrawerHeader}
        <Divider />
        {DrawerBody}
        {DrawerFooter}
      </Box>
    </Drawer>
  );
}

function SideNavItemButton(props: {
  isNavOpening: boolean;
  navLinkComponent: NavLinkComponent;
  symbol: string;
  text: string;
}) {
  const { isNavOpening, symbol, text, navLinkComponent } = props;

  return (
    <ListItemButton
      component={navLinkComponent}
      className="hover:bg-surface-3 hover:text-primary-light"
      activeClassName="text-primary bg-surface-2"
    >
      <ListItemIcon className="text-inherit">
        <MaterialSymbol symbol={symbol} className="pb-1 pl-1.5 text-4xl" />
      </ListItemIcon>
      <ListItemText className={`${isNavOpening ? 'opacity-100' : 'opacity-0'}`}>{text}</ListItemText>
    </ListItemButton>
  );
}
