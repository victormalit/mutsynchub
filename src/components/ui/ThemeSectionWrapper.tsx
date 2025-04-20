import React from "react";
import clsx from "clsx";

interface ThemeSectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const ThemeSectionWrapper: React.FC<ThemeSectionWrapperProps> = ({ children, className }) => {
  return (
    <section
      className={clsx(
        "relative overflow-hidden text-white py-24 px-6 transition-colors duration-500",
        "bg-[linear-gradient(to_br,_#3730a3,_#7e22ce,_#1e3a8a)]", // light mode gradient
        "dark:bg-[linear-gradient(to_br,_#0f172a,_#1e293b,_#312e81)]", // dark mode gradient
        className
      )}
    >
      {children}
    </section>
  );
};

export default ThemeSectionWrapper;
