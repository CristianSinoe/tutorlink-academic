import PropTypes from "prop-types";
import RoleRoute from "./RoleRoute";
export default function AdminRoute({children}) { return <RoleRoute role="ADMIN">{children}</RoleRoute>; }
AdminRoute.propTypes = { children: PropTypes.node };
