// src/theme.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  components: {
    Accordion: { 
      baseStyle: {
        container: {
          isolation: 'isolate',
        },
      },
    },
  },
});

export default theme;
