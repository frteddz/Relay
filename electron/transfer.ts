export interface TransferRequestHeader {
  type: "transfer-request";
  transferId: string;
  fileName: string;
  fileSize: number;
  fromId: string;
  fromName: string;
  tcpPort: number;
}

export interface TransferProgress {
  transferId: string;
  transferred: number;
  total: number;
  speed: number;
}

export type TransferEndReason = "completed" | "failed" | "canceled";

export interface TransferEnd {
  transferId: string;
  reason: TransferEndReason;
  error?: string;
}
