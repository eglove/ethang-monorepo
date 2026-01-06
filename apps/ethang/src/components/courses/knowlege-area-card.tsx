import { Chip } from "@heroui/react";

type KnowledgeAreaCardProperties = {
  id: string;
};

export const KnowledgeArea = ({
  id,
}: Readonly<KnowledgeAreaCardProperties>) => {
  return (
    <div key={id} className="flex justify-between gap-2">
      <p className="text-sm text-wrap text-clip">{id}</p>
      <Chip size="sm">{id}</Chip>
    </div>
  );
};
