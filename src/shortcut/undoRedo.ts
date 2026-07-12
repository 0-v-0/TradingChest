export interface Command {
  undo(): void
  redo(): void
}

export class UndoRedoManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxHistory: number

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory
  }

  push(command: Command): void {
    this.redoStack = []
    this.undoStack.push(command)
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.splice(0, this.undoStack.length - this.maxHistory)
    }
  }

  undo(): void {
    const command = this.undoStack.pop()
    if (command) {
      command.undo()
      this.redoStack.push(command)
    }
  }

  redo(): void {
    const command = this.redoStack.pop()
    if (command) {
      command.redo()
      this.undoStack.push(command)
    }
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }
}
