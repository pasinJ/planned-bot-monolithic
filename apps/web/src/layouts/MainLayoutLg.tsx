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

export default function MainLayoutLg({ children }: PropsWithChildren) {
  return (
    <div className="flex">
      <SideNav />
      <Box component="main" className="w-full">
        <TopBar />
        {children}
      </Box>
    </div>
  );
}

function TopBar() {
  return (
    <Box className="h-20 w-full bg-gray-50 shadow-2 shadow-gray-100 dark:bg-gray-900 dark:shadow-gray-800">
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
        Top Bar
      </Typography>
    </Box>
  );
}

function SideNav() {
  const [open, setOpen] = useState(false);

  const handleDrawerToggle = () => setOpen((prevState) => !prevState);
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const drawerCommonClassName = `bg-slate-700 flex overflow-x-hidden transition-width text-slate-400`;
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
    <List className="h-full">
      <SideNavItemButton isNavOpening={open} symbol="note" text="Menu 1" />
      <SideNavItemButton isNavOpening={open} symbol="note" text="Menu 2" />
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
      component="nav"
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

function SideNavItemButton({
  isNavOpening,
  symbol,
  text,
}: {
  isNavOpening: boolean;
  symbol: string;
  text: string;
}) {
  return (
    <ListItemButton className="hover:text-primary-light">
      <ListItemIcon className="text-inherit">
        <MaterialSymbol symbol={symbol} className="pb-1 pl-1.5 text-4xl" />
      </ListItemIcon>
      <ListItemText className={`${isNavOpening ? 'opacity-100' : 'opacity-0'}`}>{text}</ListItemText>
    </ListItemButton>
  );
}
