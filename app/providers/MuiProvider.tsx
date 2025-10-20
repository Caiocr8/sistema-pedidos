'use client';

import * as React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@/app/theme';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const muiCache = createCache({ key: 'mui', prepend: true });

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={muiCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
