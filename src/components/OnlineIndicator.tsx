import { useIsOnline } from "@/hooks/usePresence";
import { cn } from "@/lib/utils";

interface Props {
  email?: string | null;
  className?: string;
  showLabel?: boolean;
}

/**
 * Small green/gray dot showing whether a user is currently online
 * (i.e. has the app open on any device).
 */
const OnlineIndicator = ({ email, className, showLabel = false }: Props) => {
  const online = useIsOnline(email);
  const label = online ? "Online" : "Offline";

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={label}
      aria-label={label}
    >
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white",
          online ? "bg-green-500 animate-pulse" : "bg-gray-300"
        )}
      />
      {showLabel && (
        <span className={cn("text-xs", online ? "text-green-700" : "text-gray-500")}>
          {label}
        </span>
      )}
    </span>
  );
};

export default OnlineIndicator;
