"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-800 animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#f97316] transition-all focus:outline-none focus:ring-[#f97316]"
      >
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={user.fullName || "User"}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#f97316] flex items-center justify-center text-white font-medium">
            {(user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0] || "U").toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f97316] flex items-center justify-center text-white font-medium">
                    {(user.firstName?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-white truncate">
                  {user.fullName || "User"}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {user.username || user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/profile");
              }}
              className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard");
              }}
              className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-800 py-2">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-800 hover:text-red-400 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
