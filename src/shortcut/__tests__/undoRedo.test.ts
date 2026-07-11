import { describe, it, expect, vi } from 'vitest'
import { UndoRedoManager, type Command } from '../undoRedo'

function createMockCmd(): Command {
  return { undo: vi.fn(), redo: vi.fn() }
}

describe('UndoRedoManager', () => {
  describe('push', () => {
    it('adds a command to the undo stack', () => {
      const mgr = new UndoRedoManager()
      const cmd = createMockCmd()
      mgr.push(cmd)
      expect(mgr.canUndo).toBe(true)
    })

    it('clears redo stack on new push after an undo', () => {
      const mgr = new UndoRedoManager()
      const cmd1 = createMockCmd()
      const cmd2 = createMockCmd()
      mgr.push(cmd1)
      mgr.undo()
      expect(mgr.canRedo).toBe(true)
      mgr.push(cmd2)
      expect(mgr.canRedo).toBe(false)
    })

    it('trims oldest commands when exceeding maxHistory', () => {
      const mgr = new UndoRedoManager(2)
      const oldest = createMockCmd()
      mgr.push(oldest)
      mgr.push(createMockCmd())
      mgr.push(createMockCmd())
      mgr.undo()
      mgr.undo()
      expect(mgr.canUndo).toBe(false)
      // redo the two we popped
      mgr.redo()
      mgr.redo()
      expect(mgr.canRedo).toBe(false)
      // now verify oldest was evicted: only 2 commands ever in stack
      mgr.undo()
      mgr.undo()
      expect(mgr.canUndo).toBe(false)
    })
  })

  describe('undo', () => {
    it('calls undo on the top command and moves it to the redo stack', () => {
      const mgr = new UndoRedoManager()
      const cmd = createMockCmd()
      mgr.push(cmd)
      mgr.undo()
      expect(cmd.undo).toHaveBeenCalledTimes(1)
      expect(mgr.canUndo).toBe(false)
      expect(mgr.canRedo).toBe(true)
    })

    it('undoes multiple commands in LIFO order', () => {
      const mgr = new UndoRedoManager()
      const cmd1 = createMockCmd()
      const cmd2 = createMockCmd()
      mgr.push(cmd1)
      mgr.push(cmd2)
      mgr.undo()
      expect(cmd2.undo).toHaveBeenCalledTimes(1)
      expect(cmd1.undo).not.toHaveBeenCalled()
      mgr.undo()
      expect(cmd1.undo).toHaveBeenCalledTimes(1)
    })

    it('is a no-op when the undo stack is empty', () => {
      const mgr = new UndoRedoManager()
      expect(() => mgr.undo()).not.toThrow()
      expect(mgr.canUndo).toBe(false)
    })
  })

  describe('redo', () => {
    it('calls redo on the last undone command and moves it back to the undo stack', () => {
      const mgr = new UndoRedoManager()
      const cmd = createMockCmd()
      mgr.push(cmd)
      mgr.undo()
      expect(mgr.canUndo).toBe(false)
      mgr.redo()
      expect(cmd.redo).toHaveBeenCalledTimes(1)
      expect(mgr.canUndo).toBe(true)
      expect(mgr.canRedo).toBe(false)
    })

    it('is a no-op when the redo stack is empty', () => {
      const mgr = new UndoRedoManager()
      expect(() => mgr.redo()).not.toThrow()
      expect(mgr.canRedo).toBe(false)
    })
  })

  describe('clear', () => {
    it('clears both undo and redo stacks', () => {
      const mgr = new UndoRedoManager()
      mgr.push(createMockCmd())
      mgr.undo()
      mgr.clear()
      expect(mgr.canUndo).toBe(false)
      expect(mgr.canRedo).toBe(false)
    })
  })
})
