const variants = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  neutral: "bg-stone-200 text-stone-800 hover:bg-stone-300",
  danger: "bg-red-100 text-red-700 hover:bg-red-200",
  dangerSolid: "bg-red-700 text-white hover:bg-red-800",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
