declare module 'react-beautiful-dnd' {
    import * as React from 'react';
  
    export interface DraggableProps {
      draggableId: string;
      index: number;
      children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactElement;
    }
  
    export interface DroppableProps {
      droppableId: string;
      children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactElement;
    }
  
    export interface DragDropContextProps {
      onDragEnd: (result: DropResult, provided: ResponderProvided) => void;
      children: React.ReactNode;
    }
  
    export interface DraggableProvided {
      draggableProps: Record<string, any>;
      dragHandleProps: Record<string, any> | null;
      innerRef: (element: HTMLElement | null) => void;
    }
  
    export interface DroppableProvided {
      droppableProps: Record<string, any>;
      innerRef: (element: HTMLElement | null) => void;
      placeholder: React.ReactElement | null;
    }
  
    export interface DraggableStateSnapshot {
      isDragging: boolean;
      isDropAnimating: boolean;
      draggingOver: string | null;
    }
  
    export interface DroppableStateSnapshot {
      isDraggingOver: boolean;
      draggingOverWith: string | null;
    }
  
    export interface DropResult {
      draggableId: string;
      type: string;
      source: {
        droppableId: string;
        index: number;
      };
      destination: {
        droppableId: string;
        index: number;
      } | null;
      reason: 'DROP' | 'CANCEL';
    }
  
    export interface ResponderProvided {
      announce: (message: string) => void;
    }
  
    export const DragDropContext: React.ComponentType<DragDropContextProps>;
    export const Droppable: React.ComponentType<DroppableProps>;
    export const Draggable: React.ComponentType<DraggableProps>;
  }