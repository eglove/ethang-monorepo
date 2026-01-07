import { gql } from "@apollo/client";

export const KNOWLEDGE_AREA_FRAGMENT = gql`
  fragment KnowledgeAreaFields on KnowledgeArea {
    courseCount
    name
    order
    id
  }
`;

export type KnowledgeArea = {
  courseCount: number;
  id: string;
  name: string;
  order: number;
};

export type KnowledgeAreas = {
  knowledgeAreas: KnowledgeArea[];
};

export const getKnowledgeAreas = gql`
  query KnowledgeAreas {
    knowledgeAreas {
      ...KnowledgeAreaFields
    }
  }
  ${KNOWLEDGE_AREA_FRAGMENT}
`;
