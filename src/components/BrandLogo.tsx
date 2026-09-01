import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/ugalights-logo.png.asset.json";

export function BrandLogo({
  className = "h-9 w-auto md:h-11",
  to = "/",
}: {
  className?: string;
  to?: string;
}) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label="UGALights home">
      <img
        src={logoAsset.url}
        alt="UGALights - because your home deserves the best"
        className={className}
        width={1300}
        height={457}
      />
    </Link>
  );
}
