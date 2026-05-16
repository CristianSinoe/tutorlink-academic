export default function Logo({
  variant = "horizontal", // horizontal | vertical | isotype | monoWhite | black
  className = "",
  alt = "TutorLink Logo",
}) {
  const variants = {
    horizontal: "/horizontal.svg",
    vertical: "/tutorlink-logo-primary-vertical.svg",
    isotype: "/tutorlink-isotype.svg",
    monoWhite: "/white02.svg",
    black: "/tutorlink-logotype-black.svg",
  };

  return (
    <img
      src={variants[variant]}
      alt={alt}
      className={`select-none ${className}`}
      draggable={false}
    />
  );
}
