import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { MouseEventHandler, PropsWithChildren, useState } from 'react';

import MaterialSymbol from '#components/MaterialSymbol';

export default function MainLayoutSm({ children }: PropsWithChildren) {
  const [isDrawerOpening, setIsDrawerOpening] = useState(false);

  const toggleDrawer = () => setIsDrawerOpening((prev) => !prev);

  return (
    <Box className="flex">
      <TopAppBar toggleDrawer={toggleDrawer} />
      <SideNav isDrawerOpening={isDrawerOpening} toggleDrawer={toggleDrawer} />
      <Box component="main" className="flex w-full flex-col">
        <Toolbar />
        {children}
        SideDrawer
      </Box>
    </Box>
  );
}

function TopAppBar({ toggleDrawer }: { toggleDrawer: MouseEventHandler }) {
  return (
    <AppBar component="nav" className="bg-primary/[.04] text-textColor-onPrimary">
      <Toolbar className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Box>
          <IconButton color="inherit" aria-label="open drawer" onClick={toggleDrawer}>
            <MaterialSymbol symbol="menu" className="text-3xl" />
          </IconButton>
        </Box>
        <Typography variant="h4" aria-hidden="true" color="primary">
          Planned
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

function SideNav({
  isDrawerOpening,
  toggleDrawer,
}: {
  isDrawerOpening: boolean;
  toggleDrawer: MouseEventHandler;
}) {
  const paperClassName = 'box-border w-72';

  return (
    <Box component="nav">
      <Drawer
        variant="temporary"
        open={isDrawerOpening}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ className: paperClassName }}
      >
        <Box className="py-2 px-4 text-right">
          <IconButton color="inherit" aria-label="close drawer" onClick={toggleDrawer}>
            <MaterialSymbol symbol="close" className="text-3xl" />
          </IconButton>
        </Box>
        <Divider />
        <List className="h-full py-4">
          <SideNavItemButton symbol="note" text="Menu 1" closeDrawer={toggleDrawer} />
          <SideNavItemButton symbol="note" text="Menu 2" closeDrawer={toggleDrawer} />
        </List>
      </Drawer>
    </Box>
  );
}

function SideNavItemButton({
  symbol,
  text,
  closeDrawer: toggleDrawer,
}: {
  symbol: string;
  text: string;
  closeDrawer: MouseEventHandler;
}) {
  return (
    <ListItemButton className="hover:text-primary-light" onClick={toggleDrawer}>
      <ListItemIcon className="text-inherit">
        <MaterialSymbol symbol={symbol} className="px-3 pb-1 text-4xl" />
      </ListItemIcon>
      <ListItemText>{text}</ListItemText>
    </ListItemButton>
  );
}
