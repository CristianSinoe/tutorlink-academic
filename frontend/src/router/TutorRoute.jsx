import PropTypes from "prop-types";
import RoleRoute from "./RoleRoute";
export default function TutorRoute({children}) { return <RoleRoute role="TUTOR">{children}</RoleRoute>; }
TutorRoute.propTypes = { children: PropTypes.node };
