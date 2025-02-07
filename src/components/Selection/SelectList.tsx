import React from 'react';
import { Select } from '@chakra-ui/react';
import { List } from '../../types/type';

interface SelectListProps {
  selectedList: string;
  lists: List[];
  handleListChange: (listId: string) => void;
}

const SelectList: React.FC<SelectListProps> = ({
  selectedList,
  lists,
  handleListChange
}) => {
  return (
    <Select
      value={selectedList}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleListChange(e.target.value)}
      bg="gray.700"
      borderColor="gray.600"
      color="white"
    >
      {lists.map((list) => (
        <option 
          key={`select-option-${list.id}`}
          value={list.id}
        >
          {list.name}
        </option>
      ))}
    </Select>
  );
};

export default SelectList; 