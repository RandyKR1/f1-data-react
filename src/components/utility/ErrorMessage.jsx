import { Link } from "react-router-dom";

const ErrorMessage = ({ message }) => (
    <div className="container text-center mt-5">
        <div className="alert alert-danger" role="alert">
            {message}
        </div>
        <Link to="/" className="btn btn-outline-secondary">
            Back to search
        </Link>
    </div>
);

export default ErrorMessage;
