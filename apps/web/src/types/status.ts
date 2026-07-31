export type SubsystemState = "ready" | "loading" | "waiting" | "offline" | "error";

export interface SubsystemStatus {
  readonly label: string;
  readonly state: SubsystemState;
  readonly detail: string;
}
