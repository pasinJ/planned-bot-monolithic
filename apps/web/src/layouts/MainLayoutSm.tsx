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
import { NavLinkComponent } from '#routes/components/NavLinkBase';
import { BacktestMainPageLink } from '#routes/components/pageLinks';

export default function MainLayoutSm({ children }: PropsWithChildren) {
  const [isDrawerOpening, setIsDrawerOpening] = useState(false);

  const toggleDrawer = () => setIsDrawerOpening((prev) => !prev);

  return (
    <div className="flex">
      <TopAppBar toggleDrawer={toggleDrawer} />
      <SideNav isDrawerOpening={isDrawerOpening} toggleDrawer={toggleDrawer} />
      <main className="relative flex min-h-screen w-full flex-col">
        <Toolbar />
        <div className="flex-grow bg-gray-100 px-4 py-6">{children}</div>
      </main>
    </div>
  );
}

function TopAppBar({ toggleDrawer }: { toggleDrawer: MouseEventHandler }) {
  return (
    <AppBar component="nav" className="bg-surface-1 text-textColor-onPrimary">
      <Toolbar className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Box>
          <IconButton color="inherit" aria-label="open navigation drawer" onClick={toggleDrawer}>
            <MaterialSymbol symbol="menu" className="text-3xl" />
          </IconButton>
        </Box>
        <Typography variant="h4" aria-hidden="true" color="primary" className="text-center">
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
  return (
    <Box component="nav">
      <Drawer
        variant="temporary"
        open={isDrawerOpening}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ className: 'box-border w-72' }}
      >
        <Box className="px-4 py-2 text-right">
          <IconButton color="inherit" aria-label="close drawer" onClick={toggleDrawer}>
            <MaterialSymbol symbol="close" className="text-3xl" />
          </IconButton>
        </Box>
        <Divider />
        <List className="h-full py-4" component="nav">
          <SideNavItemButton
            symbol="youtube_searched_for"
            text="Backtesting"
            navLinkComponent={BacktestMainPageLink}
            toggleDrawer={toggleDrawer}
          />
        </List>
      </Drawer>
    </Box>
  );
}

function SideNavItemButton({
  symbol,
  text,
  navLinkComponent,
  toggleDrawer,
}: {
  symbol: string;
  text: string;
  navLinkComponent: NavLinkComponent;
  toggleDrawer: MouseEventHandler;
}) {
  return (
    <ListItemButton
      component={navLinkComponent}
      className="hover:bg-surface-3 hover:text-primary-light"
      activeClassName="text-primary bg-surface-2"
      onClick={toggleDrawer}
    >
      <ListItemIcon className="text-inherit">
        <MaterialSymbol symbol={symbol} className="px-3 pb-1 text-4xl" />
      </ListItemIcon>
      <ListItemText>{text}</ListItemText>
    </ListItemButton>
  );
}
