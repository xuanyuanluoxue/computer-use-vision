/**
 * Tool definitions for the computer-use capability.
 *
 * Each factory accepts a {@link WindowsDriver} and returns a tool built with
 * {@link defineTool}. Closures over the driver instance match the standard DSH
 * pattern (cf. tool-todo) where apply() owns the runtime wiring.
 *
 * @module @deepseek-ai/dsh-computer-use/tools
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { WindowsDriver } from './windows-driver.ts'

// ---------------------------------------------------------------------------
// computer-see
// ---------------------------------------------------------------------------

/**
 * One-step screen observation: screenshot → vision model description.
 * The model receives a natural-language description and, when requested,
 * estimated pixel coordinates relative to the screenshot.
 */
export function createSeeTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-see',
    description:
      'Take a screenshot and describe it using a vision model. '
      + 'Use this to observe the current state of the screen before performing actions. '
      + 'The screenshot uses physical pixel coordinates (DPI-aware); coordinates returned '
      + 'by the vision model can be used directly with computer-click.',
    parameters: {
      prompt: {
        type: 'string',
        required: true,
        description: 'What to ask the vision model about the screenshot (e.g. "Describe the screen and give button coordinates").',
      },
      window_title: {
        type: 'string',
        description: 'Optional: capture only a specific window by title substring.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string', required: true },
        },
      },
      render: (_args: Record<string, unknown>, value: Record<string, unknown>) => [{ type: 'text', text: String(value.description) }],
    },
    async execute(args) {
      const description = await driver.see(args.prompt, args.window_title || undefined)
      return { description }
    },
  })
}

// ---------------------------------------------------------------------------
// computer-click / computer-rightclick
// ---------------------------------------------------------------------------

export function createClickTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-click',
    description:
      'Simulate a left mouse click at the given screen coordinates (physical pixels, DPI-aware). '
      + 'Use computer-see first to identify target coordinates.',
    parameters: {
      x: { type: 'number', required: true, description: 'Screen X coordinate (physical pixels).' },
      y: { type: 'number', required: true, description: 'Screen Y coordinate (physical pixels).' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { clicked: { type: 'boolean', required: true } },
      },
      render: () => [{ type: 'text', text: 'Clicked.' }],
    },
    async execute(args) {
      await driver.click(args.x, args.y)
      return { clicked: true }
    },
  })
}

export function createRightclickTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-rightclick',
    description:
      'Simulate a right mouse click at the given screen coordinates (physical pixels, DPI-aware).',
    parameters: {
      x: { type: 'number', required: true, description: 'Screen X coordinate.' },
      y: { type: 'number', required: true, description: 'Screen Y coordinate.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { clicked: { type: 'boolean', required: true } },
      },
      render: () => [{ type: 'text', text: 'Right-clicked.' }],
    },
    async execute(args) {
      await driver.rightclick(args.x, args.y)
      return { clicked: true }
    },
  })
}

// ---------------------------------------------------------------------------
// computer-drag
// ---------------------------------------------------------------------------

export function createDragTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-drag',
    description:
      'Simulate a mouse drag from one screen position to another (physical pixels).',
    parameters: {
      from_x: { type: 'number', required: true, description: 'Start X.' },
      from_y: { type: 'number', required: true, description: 'Start Y.' },
      to_x: { type: 'number', required: true, description: 'End X.' },
      to_y: { type: 'number', required: true, description: 'End Y.' },
      modifiers: {
        type: 'string',
        description: 'Optional modifier keys during drag (e.g. "Shift", "Ctrl").',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { dragged: { type: 'boolean', required: true } },
      },
      render: () => [{ type: 'text', text: 'Dragged.' }],
    },
    async execute(args) {
      await driver.drag(args.from_x, args.from_y, args.to_x, args.to_y, args.modifiers || undefined)
      return { dragged: true }
    },
  })
}

// ---------------------------------------------------------------------------
// computer-type / computer-key
// ---------------------------------------------------------------------------

export function createTypeTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-type',
    description:
      'Type text into the currently focused field via clipboard paste. '
      + 'For CJK text, ensure the target field is focused and cleared first. '
      + 'Clipboard is temporarily used; restore if needed.',
    parameters: {
      text: { type: 'string', required: true, description: 'The text to type.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { typed: { type: 'boolean', required: true } },
      },
      render: () => [{ type: 'text', text: 'Typed.' }],
    },
    async execute(args) {
      await driver.type(args.text)
      return { typed: true }
    },
  })
}

export function createKeyTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-key',
    description:
      'Send a keyboard shortcut or key combination. '
      + 'Examples: "Ctrl+A", "Ctrl+Shift+N", "Enter", "Alt+F4", "F2".',
    parameters: {
      keys: {
        type: 'string',
        required: true,
        description: 'The key combination string (e.g. "Ctrl+C", "Enter", "Alt+Tab").',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { sent: { type: 'boolean', required: true } },
      },
      render: (_args: Record<string, unknown>, value: Record<string, unknown>) => [{ type: 'text', text: `Sent: ${String(value.sent)}` }],
    },
    async execute(args) {
      await driver.key(args.keys)
      return { sent: true }
    },
  })
}

// ---------------------------------------------------------------------------
// computer-scroll
// ---------------------------------------------------------------------------

export function createScrollTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-scroll',
    description:
      'Scroll the mouse wheel at screen coordinates. Positive delta scrolls up, negative scrolls down.',
    parameters: {
      x: { type: 'number', required: true, description: 'Screen X coordinate.' },
      y: { type: 'number', required: true, description: 'Screen Y coordinate.' },
      delta: {
        type: 'number',
        required: true,
        description: 'Scroll amount: positive = up, negative = down. Typical value: ±300 to ±600.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { scrolled: { type: 'boolean', required: true } },
      },
      render: () => [{ type: 'text', text: 'Scrolled.' }],
    },
    async execute(args) {
      await driver.scroll(args.x, args.y, args.delta)
      return { scrolled: true }
    },
  })
}

// ---------------------------------------------------------------------------
// computer-knowledge
// ---------------------------------------------------------------------------

export function createKnowledgeTool(driver: WindowsDriver) {
  return defineTool({
    name: 'computer-knowledge',
    description:
      'Query the self-evolving application knowledge base. '
      + 'Use BEFORE operating any application: search for known shortcuts, '
      + 'UI structure notes, and pitfalls. Actions: list (all apps), '
      + 'search (keyword), app (full document for one app).',
    parameters: {
      action: {
        type: 'string',
        required: true,
        enum: ['list', 'search', 'app'],
        description: '"list" all apps, "search" by keyword, or get full "app" document.',
      },
      query: {
        type: 'string',
        description: 'Search keyword or app identifier (required for search/app actions).',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { result: { type: 'string', required: true } },
      },
      render: (_args: Record<string, unknown>, value: Record<string, unknown>) => [{ type: 'text', text: String(value.result) }],
    },
    async execute(args) {
      if ((args.action === 'search' || args.action === 'app') && !args.query) {
        throw new Error(`computer-knowledge action "${args.action}" requires a query`)
      }
      const result = await driver.knowledge(args.action, args.query || undefined)
      return { result }
    },
  })
}
