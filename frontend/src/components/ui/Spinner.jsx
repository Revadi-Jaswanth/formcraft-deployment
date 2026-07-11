export default function Spinner({ size = "md" }) {
  const sizes = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={`${sizes[size]} border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin`}
    />
  );
}
