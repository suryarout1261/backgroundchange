import type { Adjustments, BackgroundConfig, CropState, PhotoPreset, SubjectShadow, SubjectTransform } from './types';

export interface HistorySnapshot {
  background: BackgroundConfig;
  adjustments: Adjustments;
  subjectTransform: SubjectTransform;
  subjectShadow: SubjectShadow;
  crop: CropState;
  activePreset: PhotoPreset | null;
  exportWidth: number;
  exportHeight: number;
  description?: string;
}

export class HistoryManager {
  private snapshots: HistorySnapshot[] = [];
  private currentIndex: number = -1;
  private readonly maxLimit: number;

  constructor(maxLimit = 50) {
    this.maxLimit = maxLimit;
  }

  /**
   * Reset the history stack and set the initial base snapshot.
   */
  public init(initial: HistorySnapshot) {
    this.snapshots = [JSON.parse(JSON.stringify(initial))];
    this.currentIndex = 0;
  }

  /**
   * Record a new step in the history.
   * Discards any future redo steps if branching from an earlier point.
   * Ignores identical snapshots to avoid redundant entries.
   */
  public record(snapshot: HistorySnapshot): boolean {
    const cloned: HistorySnapshot = JSON.parse(JSON.stringify(snapshot));

    // If identical to current state, ignore duplicate
    if (this.currentIndex >= 0 && this.currentIndex < this.snapshots.length) {
      const current = this.snapshots[this.currentIndex];
      if (this.isEqual(current, cloned)) {
        return false;
      }
    }

    // Discard any forward redo steps if we made a new action
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    }

    this.snapshots.push(cloned);

    // Limit maximum history size
    if (this.snapshots.length > this.maxLimit) {
      this.snapshots.shift();
    } else {
      this.currentIndex++;
    }

    return true;
  }

  /**
   * Step backward 1 step in history.
   */
  public undo(): HistorySnapshot | null {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.snapshots[this.currentIndex]));
  }

  /**
   * Step forward 1 step in history.
   */
  public redo(): HistorySnapshot | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.snapshots[this.currentIndex]));
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex >= 0 && this.currentIndex < this.snapshots.length - 1;
  }

  public getCurrentSnapshot(): HistorySnapshot | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.snapshots.length) {
      return JSON.parse(JSON.stringify(this.snapshots[this.currentIndex]));
    }
    return null;
  }

  public get count(): number {
    return this.snapshots.length;
  }

  public get index(): number {
    return this.currentIndex;
  }

  public clear() {
    this.snapshots = [];
    this.currentIndex = -1;
  }

  private isEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

