"use client";

import { Heart } from "lucide-react";
import { useFavorite } from "@/hooks/use-favorite";
import { useAuth } from "@/components/auth-provider";
import { useState } from "react";

interface LikeButtonProps {
  propertyId: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { button: "w-8 h-8", icon: "w-3.5 h-3.5", text: "text-[10px]" },
  md: { button: "w-10 h-10", icon: "w-4.5 h-4.5", text: "text-xs" },
  lg: { button: "w-11 h-11", icon: "w-5 h-5", text: "text-[10px]" },
};

export function LikeButton({
  propertyId,
  size = "md",
  showCount = false,
  className = "",
}: LikeButtonProps) {
  const { user } = useAuth();
  const { favorited, likesCount, toggle, loading } = useFavorite(propertyId);
  const [animating, setAnimating] = useState(false);

  const config = sizeConfig[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    await toggle();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex flex-col items-center gap-1 group ${className}`}
      aria-label={favorited ? "Descurtir" : "Curtir"}
    >
      <div
        className={`${config.button} rounded-full flex items-center justify-center transition-all duration-200 ${
          favorited
            ? "bg-red-500 scale-110"
            : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
        } ${animating ? "scale-[1.3]" : ""}`}
        style={{
          transition: "transform 0.2s ease-out, background-color 0.2s ease-out",
        }}
      >
        <Heart
          className={`${config.icon} transition-transform duration-200 ${
            favorited
              ? "text-white fill-white"
              : "text-white group-hover:scale-110"
          }`}
        />
      </div>
      {showCount && (
        <span className={`text-white/70 ${config.text}`}>
          {likesCount > 0 ? likesCount : "Curtir"}
        </span>
      )}
    </button>
  );
}
