import { MenuList as ChakraMenuList, MenuListProps } from "@chakra-ui/react";
import React from "react";

const StyledMenuList: React.FC<MenuListProps> = (props) => {
  return (
    <ChakraMenuList
      {...props}
      style={{ backgroundColor: 'black', borderColor: 'gray.600', color: 'white' }}
    />
  );
};

export default StyledMenuList;
