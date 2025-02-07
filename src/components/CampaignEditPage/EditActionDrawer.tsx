import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  useToast,
} from '@chakra-ui/react';
import { Action, Campaign, ActionConfig } from '../../types/type';
import { updateAction, createAction } from '../../utils/campaignService';
import MessageForm from './actionForms/MessageForm';
import InvitationForm from './actionForms/InvitationForm';
import LikePostForm from './actionForms/LikePostForm';
import FollowUnfollowForm from './actionForms/FollowUnfollowForm';
import DelayForm from './actionForms/DelayForm';

interface EditActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  action: Action;
  campaign: Campaign;
  onUpdateAction: (updatedAction: Action) => void;
}

const EditActionDrawer: React.FC<EditActionDrawerProps> = ({
  isOpen,
  onClose,
  action,
  campaign,
  onUpdateAction,
}) => {
  const [localAction, setLocalAction] = useState<Action>({...action});
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setLocalAction({...action});
    console.log("Loaded action for editing:", action);
  }, [action]);

  const handleUpdate = (updatedFields: Partial<Action>) => {
    setLocalAction((prev) => {
      const updatedAction: Action = {
        ...prev,
        ...updatedFields,
        config: {
          ...prev.config,
          ...(updatedFields.config as ActionConfig)
        }
      };
      console.log("Updating local action:", updatedAction);
      return updatedAction;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!localAction) {
        throw new Error('No action to save');
      }
  
      console.log("Saving action:", localAction);
  
      let updatedAction: Action;
      
      if (localAction.id && typeof localAction.id === 'number') {
        const result = await updateAction({
          ...localAction,
          custom_name: localAction.custom_name || undefined
        });
        if (!result) throw new Error('Failed to update action');
        updatedAction = result;
      } else {
        const { id, ...actionWithoutId } = localAction;
        const newAction: Omit<Action, 'id'> = {
          ...actionWithoutId,
          campaign_id: campaign.id,
          order: campaign.workflow.length + 1,
          custom_name: localAction.custom_name || undefined
        };
        const result = await createAction(newAction);
        if (!result) throw new Error('Failed to create action');
        updatedAction = result;
      }
      
      console.log("Action saved successfully:", updatedAction);
      onUpdateAction(updatedAction);
      toast({
        title: "Action saved",
        description: "Your changes have been saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Error saving action",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderForm = () => {
    switch (localAction.type) {
      case 'SEND_INVITATION':
        return <InvitationForm action={localAction} onUpdate={handleUpdate} />;
      case 'SEND_MESSAGE':
        return <MessageForm action={localAction} onUpdate={handleUpdate} />;
      case 'LIKE_POST':
        return <LikePostForm action={localAction} onUpdate={handleUpdate} />;
      case 'FOLLOW_UNFOLLOW':
        return <FollowUnfollowForm action={localAction} onUpdate={handleUpdate} />;
      case 'VISIT_PROFILE':
        return (
          <FormControl>
            <FormLabel>Number of Profiles to Visit</FormLabel>
            <Input
              type="number"
              value={(localAction.config as any).profileCount || 1}
              onChange={(e) => handleUpdate({ config: { ...localAction.config, profileCount: parseInt(e.target.value, 10) } })}
              min={1}
            />
          </FormControl>
        );
      case 'DELAY':
        return <DelayForm action={localAction} onUpdate={handleUpdate} />;
      default:
        return null;
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg="gray.800" color="white">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">Edit {localAction.name}</DrawerHeader>
        <DrawerBody>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Action Name</FormLabel>
              <Input
                value={localAction.name}
                onChange={(e) => handleUpdate({ name: e.target.value })}
                placeholder="Enter action name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Secondary Action Name</FormLabel>
              <Input
                value={localAction.custom_name || ''}
                onChange={(e) => {
                  console.log("Updating secondary name:", e.target.value);
                  handleUpdate({ custom_name: e.target.value || undefined });
                }}
                placeholder="Enter secondary action name (optional)"
              />
            </FormControl>

            {renderForm()}

            <Button 
              colorScheme="blue" 
              onClick={handleSave} 
              isLoading={isSaving}
              loadingText="Saving"
            >
              Save Changes
            </Button>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default EditActionDrawer;