import { gql } from "@apollo/client";

export type KnowledgeAreas = {
  knowledgeAreas: {
    courseCount: number;
    id: string;
    name: string;
    order: number;
  }[];
};

export const getKnowledgeAreas = gql`
  query KnowledgeAreas {
    knowledgeAreas {
      courseCount
      name
      order
      id
    }
  }
`;
