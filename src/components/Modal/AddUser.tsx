import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { userSignup, updateUser } from "../../utils/supabase";

const MotionModalContent = motion(ModalContent);

interface AddUserProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialUserData?: any;
}

const AddUser: React.FC<AddUserProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUserData,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullname: "",
    role: "user",
    unipile_id: ""
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [emailError, setEmailError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [unipileIdError, setUnipileIdError] = useState("");

  useEffect(() => {
    if (initialUserData) {
      setFormData({
        email: initialUserData.email,
        password: "",
        fullname: initialUserData.fullname || "",
        role: initialUserData.role || "user",
        unipile_id: initialUserData.unipile_id
      });
    }
  }, [initialUserData]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    if (name === "email") {
      validateEmail(value);
    }

    if (name === "password") {
      checkPasswordStrength(value);
    }

    if (name === "fullname") {
      validateFullName(value);
    }

    if (name === "unipile_id") {
      validateUnipileId(value);
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prevData) => ({ ...prevData, role: value }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(emailRegex.test(email) ? "" : "Invalid email address");
  };

  const checkPasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength("Weak");
    } else if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[@$!%*?&#]/.test(password)) {
      setPasswordStrength("Strong");
    } else {
      setPasswordStrength("Moderate");
    }
  };

  const validateFullName = (fullname: string) => {
    setFullNameError(fullname ? "" : "Full Name cannot be empty");
  };

  const validateUnipileId = (unipile_id: string) => {
    setUnipileIdError(unipile_id ? "" : "Unipile ID cannot be empty");
  };

  const handleAddUser = async () => {
    try {
      const newUser = await userSignup(formData);
      onSubmit(newUser);
      onClose();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updatedUser = { ...initialUserData, ...formData };
      const { error } = await updateUser(updatedUser);
      if (!error) {
        onSubmit(updatedUser);
      }
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const modalBg = useColorModeValue("gray.800", "gray.800");
  const textColor = useColorModeValue("white", "white");

  const isFormValid = !emailError && passwordStrength !== "Weak" && !fullNameError && !unipileIdError;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <MotionModalContent
        bg={modalBg}
        color={textColor}
        borderRadius="lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <ModalHeader>{initialUserData ? "Edit User" : "Add New User"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!!emailError}>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                borderRadius="md"
                isReadOnly={!!initialUserData}
              />
              {emailError && <Text color="red.500" fontSize="sm">{emailError}</Text>}
            </FormControl>
            {!initialUserData && (
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  type="password"
                  borderRadius="md"
                />
                {formData.password && <Text color={passwordStrength === "Weak" ? "red.500" : passwordStrength === "Moderate" ? "yellow.500" : "green.500"} fontSize="sm">{passwordStrength} password</Text>}
              </FormControl>
            )}
            <FormControl isInvalid={!!fullNameError}>
              <FormLabel>Full Name</FormLabel>
              <Input
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                placeholder="Enter full name"
                borderRadius="md"
              />
              {fullNameError && <Text color="red.500" fontSize="sm">{fullNameError}</Text>}
            </FormControl>
            <FormControl isInvalid={!!unipileIdError}>
              <FormLabel>Unipile Id</FormLabel>
              <Input
                name="unipile_id"
                value={formData.unipile_id}
                onChange={handleInputChange}
                placeholder="Enter Unipile Id"
                borderRadius="md"
                isReadOnly={!!initialUserData}
              />
              {unipileIdError && <Text color="red.500" fontSize="sm">{unipileIdError}</Text>}
            </FormControl>
            <FormControl as="fieldset">
              <FormLabel as="legend">Role</FormLabel>
              <RadioGroup
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
              >
                <HStack spacing={4}>
                  <Radio value="admin">Admin</Radio>
                  <Radio value="user">User</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="blue"
            ml={3}
            onClick={initialUserData ? handleUpdateUser : handleAddUser}
            isDisabled={!isFormValid}
          >
            {initialUserData ? "Update User" : "Add User"}
          </Button>
        </ModalFooter>
      </MotionModalContent>
    </Modal>
  );
};

export default AddUser;
