import { SmileIcon } from "lucide-solid";

import { ButtonStyled } from "./button-styled";

export default {
  title: "styled/button",
};

export const Default = () => {
  return (
    <ButtonStyled>
      Default
    </ButtonStyled>
  );
};

export const Outline = () => {
  return (
    <ButtonStyled variant="outline">
      Outline
    </ButtonStyled>
  );
};

export const Secondary = () => {
  return (
    <ButtonStyled variant="secondary">
      Secondary
    </ButtonStyled>
  );
};

export const Destructive = () => {
  return (
    <ButtonStyled variant="destructive">
      Destructive
    </ButtonStyled>
  );
};

export const Link = () => {
  return (
    <ButtonStyled variant="link">
      Link
    </ButtonStyled>
  );
};

export const Ghost = () => {
  return (
    <ButtonStyled variant="ghost">
      Ghost
    </ButtonStyled>
  );
};

export const IconOnly = () => {
  return (
    <ButtonStyled size="icon">
      <SmileIcon aria-label="Smile" />
    </ButtonStyled>
  );
};

export const Large = () => {
  return (
    <ButtonStyled size="lg">
      Large
    </ButtonStyled>
  );
};

export const Small = () => {
  return (
    <ButtonStyled size="sm">
      Small
    </ButtonStyled>
  );
};

