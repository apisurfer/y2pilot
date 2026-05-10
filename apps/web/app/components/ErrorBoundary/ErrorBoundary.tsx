import { Component, type ErrorInfo, type ReactNode } from 'react'
import css from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className={css.wrap}>
        <div className={css.box}>
          <h1 className={css.title}>Something went wrong</h1>
          <p className={css.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className={css.actions}>
            <button onClick={this.handleReset} className={css.button}>
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className={`${css.button} ${css.primary}`}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
