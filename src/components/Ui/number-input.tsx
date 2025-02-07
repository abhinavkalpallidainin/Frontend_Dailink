import { NumberInput as ChakraNumberInput, NumberInputProps as ChakraNumberInputProps } from "@chakra-ui/react";
import * as React from "react";

export interface NumberInputProps extends ChakraNumberInputProps {
  // Additional custom props can go here
}

export const NumberInputRoot = React.forwardRef<HTMLDivElement, NumberInputProps>(function NumberInput(props, ref) {
  const { children, ...rest } = props;
  return (
    <ChakraNumberInput ref={ref} variant="outline" {...rest}>
      {children}
    </ChakraNumberInput>
  );
});
