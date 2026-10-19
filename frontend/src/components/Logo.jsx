import PropTypes from "prop-types";
import useTheme from "../theme/useTheme";

export default function Logo({
  variant = "horizontal", // horizontal | vertical | isotype | monoWhite | black
  className = "",
  alt = "TutorLink Logo",
}) {
  const theme = useTheme();
  const variants = {
    horizontal: "/horizontal.svg",
    vertical: "/tutorlink-logo-primary-vertical.svg",
    isotype: "/tutorlink-isotype.svg",
    monoWhite: "/white02.svg",
    sidebar: "/tutorlink-isotype.svg",
    black: "/tutorlink-logotype-black.svg",
  };
  const institutionalLogo = (variant === "monoWhite" || variant === "sidebar") ? theme.sidebarLogoUrl || theme.logoUrl : theme.loginLogoUrl || theme.logoUrl;

  return (
    <img
      src={institutionalLogo || variants[variant]}
      alt={alt}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}

Logo.propTypes = {
  variant: PropTypes.string,
  className: PropTypes.string,
  alt: PropTypes.string,
};
