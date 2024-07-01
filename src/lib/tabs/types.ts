export interface ITabs {
  updateCurrent(url: string): void;
  create(url: string, active: boolean): void;
}