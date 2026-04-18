export type EdgeType =
  | "calls"
  | "contains"
  | "depends_on"
  | "exports"
  | "imports"
  | "test_for"
  | "tested_by";
export type GraphEdge = {
  from: string;
  to: string;
  type: EdgeType;
};

export type GraphNode = {
  path: string;
  type: NodeType;
};

export type NodeType = "app" | "component" | "file" | "function" | "package";
