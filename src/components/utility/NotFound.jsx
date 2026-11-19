import { Link } from "react-router-dom";

// Rendered for any URL that doesn't match a route (typos, old links, missing session key)
const NotFound = () => (
    <div className="container text-center mt-5">
        <h1 className="page-title">Page not found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-outline-secondary">
            Back to search
        </Link>
    </div>
);

export default NotFound;
