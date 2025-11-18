export type TcpMessageType = "tcp-demo" | "tcp-data";

export interface TcpMessage {
  id: string;
  type: TcpMessageType;
  payload: unknown;
  timestamp: string; // ISO string
}
