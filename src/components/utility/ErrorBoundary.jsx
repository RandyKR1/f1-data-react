import { Component } from "react";

// Catches errors thrown while rendering so one bad component
// shows a fallback message instead of a blank white page.
class ErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("Render error:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="container text-center mt-5">
                    <h2>Something went wrong</h2>
                    <p>Please try again or start a new search.</p>
                    {/* Full page load (not <Link>) so the boundary resets */}
                    <a href="/" className="btn btn-outline-secondary mt-2">
                        Home
                    </a>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
