# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

assistant-ui is an open source TypeScript/React library for building AI chat interfaces. It provides primitive components inspired by Radix UI and shadcn/ui that can be fully customized, with support for streaming, auto-scrolling, accessibility, and generative UI.

## Architecture

This is a monorepo using pnpm workspaces with Turbo for build orchestration. The key packages are:

- **packages/react** - Core React primitives and context providers
- **packages/react-ai-sdk** - Integration with Vercel AI SDK
- **packages/react-langgraph** - Integration with LangGraph
- **packages/assistant-stream** - Streaming protocol utilities
- **packages/cloud** - Assistant Cloud integration

The library follows a runtime-based architecture with three main layers:
1. **Runtime Layer** - Manages state and business logic (AssistantRuntime, ThreadRuntime, etc.)
2. **Context Layer** - React contexts that bridge runtimes to components
3. **Primitive Layer** - Unstyled UI components that can be fully customized

## Development Commands

### Root Level
- `pnpm test` - Run all tests across packages
- `pnpm prettier` - Check code formatting
- `pnpm prettier:fix` - Fix code formatting
- `turbo build` - Build all packages
- `turbo lint` - Lint all packages
- `turbo test` - Run all tests

### Package Level
- `pnpm build` - Build the package (available in react packages)
- `pnpm test` - Run package tests (vitest)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run ESLint

### Examples
- `pnpm --filter=@assistant-ui/docs dev` - Run documentation site
- Navigate to individual example directories and run `pnpm dev`

## Key Concepts

### Runtimes
Runtimes are the core abstraction that manage state and provide methods for interacting with the assistant:
- `AssistantRuntime` - Top-level runtime managing threads and global state
- `ThreadRuntime` - Manages individual conversation threads
- `MessageRuntime` - Manages individual messages within threads

### Context Providers
- `AssistantRuntimeProvider` - Provides AssistantRuntime to the component tree
- Primitives automatically consume the nearest runtime context

### Integration Patterns
- **AI SDK**: Use `useAssistantAISDK` or `useChatAISDK` hooks to create runtimes from AI SDK state
- **LangGraph**: Use `useLangGraphRuntime` with streaming endpoints
- **Custom**: Implement your own runtime by extending base runtime classes

## File Structure

- `packages/react/src/context/` - React contexts and hooks
- `packages/react/src/primitives/` - UI primitive components
- `packages/react/src/runtimes/` - Runtime implementations
- `packages/react/src/api/` - Runtime interfaces and base classes
- `examples/` - Integration examples with different backends
- `apps/docs/` - Documentation and demo site

## Testing

Uses Vitest for unit testing. Run tests with `pnpm test` at package level or `turbo test` at root level. The react package also includes mutation testing with Stryker.

## Common Patterns

- Components are built as composable primitives rather than monolithic chat components
- State management uses Zustand stores wrapped in React contexts
- Runtime methods are called directly rather than through imperative APIs
- UI customization is done by styling primitive components, not through props