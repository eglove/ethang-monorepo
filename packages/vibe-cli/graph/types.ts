export type NodeType = 'app' | 'package' | 'component' | 'function' | 'file';
export type EdgeType = 'calls' | 'imports' | 'exports' | 'depends_on' | 'contains' | 'tested_by' | 'test_for';

export interface GraphNode {
  path: string;
  type: NodeType;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}
