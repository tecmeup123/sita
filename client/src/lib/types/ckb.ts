import { ccc } from "@ckb-ccc/connector-react";

// CKB Script structure
export interface Script {
  codeHash: string;
  hashType: 'type' | 'data' | 'data1' | 'data2' | string;
  args: string;
}

export type ScriptLike = Script | string;

// CKB Cell structure
export interface Cell {
  capacity?: string;
  lock?: Script;
  type?: Script;
  data?: string;
  outPoint?: {
    txHash: string;
    index: string;
  };
  // For compatibility with various CKB libraries that structure cells differently
  cellOutput?: {
    capacity: string;
    lock?: Script;
    type?: Script;
  };
}

// Extended Client interface
export interface ExtendedClient extends ccc.Client {
  getCapacity?: (lockHash: string) => Promise<string>;
  getCapacityByLockScript?: (script: Script) => Promise<string>;
}

// Extended Signer interface
export interface ExtendedSigner extends ccc.Signer {
  getCells?: (filter: { lock: Script }) => Promise<Cell[]>;
  collector?: {
    getCellsByLockScript?: (script: Script) => Promise<Cell[]>;
  };
  client: ExtendedClient;
}

// Address type 
export interface Address {
  address?: string;  // Optional for compatibility
  lockScript?: Script;
  script?: Script;  // Some libraries use 'script' instead of 'lockScript'
}