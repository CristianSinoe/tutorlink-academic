import PropTypes from "prop-types";
import RoleRoute from "./RoleRoute";
export default function StudentRoute({children}) { return <RoleRoute role="ESTUDIANTE">{children}</RoleRoute>; }
StudentRoute.propTypes = { children: PropTypes.node };
