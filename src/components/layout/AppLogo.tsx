/**
 * AppLogo — App name and tagline.
 * compact=true renders a single-line version for the mobile header.
 */

interface AppLogoProps {
  compact?: boolean;
}

export function AppLogo({ compact }: AppLogoProps) {
  if (compact) {
    return (
      <span className="font-bold text-xl tracking-tight text-primary">
        Hiểu Chữ Hán
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="font-bold text-2xl tracking-tight text-primary leading-tight">
        Hiểu Chữ Hán
      </h1>
      <p className="text-xs text-muted-foreground">
        Tra cứu · Hán Việt · Nét chữ · Tự nguyên
      </p>
    </div>
  );
}
