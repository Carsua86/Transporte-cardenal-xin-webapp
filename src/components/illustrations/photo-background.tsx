import Image from "next/image";

const PHOTOS = ["/images/truck-1.jpg", "/images/truck-2.jpg", "/images/truck-3.jpg"];

export function PhotoBackground({
  className,
  overlayClassName = "bg-gradient-to-b from-navy-900/65 via-navy-900/55 to-navy-900/80",
}: {
  className?: string;
  overlayClassName?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`} aria-hidden="true">
      {PHOTOS.map((src, i) => (
        <div
          key={src}
          className="animate-photo-crossfade absolute inset-0"
          style={{ animationDelay: `${-(i * 6)}s` }}
        >
          <Image src={src} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
      ))}
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  );
}
