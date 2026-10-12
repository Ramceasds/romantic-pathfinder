import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_PHOTOS } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Props = {
  path: string | null | undefined;
  name: string;
  className?: string;
  draggable?: boolean;
};

export function ProfilePhoto({ path, name, className }: Props) {
  const isDemo = !!path && path in DEMO_PHOTOS;
  const { data: signed } = useQuery({
    queryKey: ["photo", path],
    enabled: !!path && !isDemo,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  const src = isDemo ? DEMO_PHOTOS[path!] : signed;

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-primary font-display text-4xl text-primary-foreground",
          className,
        )}
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      draggable={false}
      loading="lazy"
      className={cn("object-cover", className)}
    />
  );
}
