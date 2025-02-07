import React from "react";
import { Image, FormControl, } from "@chakra-ui/react";

interface CaptchaDisplayProps {
  captcha: string;
  checkpointCode: string;
  setCheckpointCode: React.Dispatch<React.SetStateAction<string>>;
}

const CaptchaDisplay: React.FC<CaptchaDisplayProps> = ({
  captcha,
  checkpointCode,
  setCheckpointCode,
}) => {
  return (
    <>
      <FormControl isRequired>
        <Image
          src={captcha}
          alt="CAPTCHA"
          mb={4}
        />
      </FormControl>
    </>
  );
};

export default CaptchaDisplay;
