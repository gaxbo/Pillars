import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Wraps decorative motion. If a scroll-linked animation ever throws, the
 * browser's animation engine rejecting a timeline, say, the section falls
 * back to its still version instead of taking the whole page, waitlist form
 * included, down with it.
 */
export class Resilient extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Motion section fell back to its still version:', error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
