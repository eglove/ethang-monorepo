import { BadgeStyled } from "./badge-styled";

export default {
  title: "styled/badge",
};

export const Default = () => {
  return (
    <div class="grid w-16 gap-4">
      <BadgeStyled>
        Default
      </BadgeStyled>
      <BadgeStyled variant="destructive">
        Destructive
      </BadgeStyled>
      <BadgeStyled variant="outline">
        Outline
      </BadgeStyled>
      <BadgeStyled variant="secondary">
        Secondary
      </BadgeStyled>
    </div>
  );
};
