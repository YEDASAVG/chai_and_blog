"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

type LandingPageProps = {
  blogCount: number;
};

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeUpSoft: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export default function LandingPage({ blogCount }: LandingPageProps) {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-[#f97316] selection:text-white">
      {/* Background Ambient Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Orange Blob - Top Left */}
        <motion.div 
          className="absolute top-[-15%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-[#f97316]/20 blur-[120px]"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Purple Blob - Bottom Right */}
        <motion.div 
          className="absolute bottom-[-15%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-purple-500/15 blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Center Subtle Warm Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-[#1a100a] blur-[100px] -z-10"></div>
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Minimal Navbar */}
        <header className="flex items-center justify-between py-6 md:py-8 w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="ChaiAndBlog"
              width={36}
              height={36}
              className="w-9 h-9 group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-bold font-[family-name:var(--font-brand)] tracking-tight">
              Chai<span className="text-[#f97316]">_And_</span>Blog
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in"
              className="hidden md:block text-white/80 hover:text-white text-sm font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="flex items-center justify-center overflow-hidden rounded-full h-10 px-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-bold border border-white/10 transition-all"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Centered Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center pb-16 md:pb-20">
          <motion.div 
            className="max-w-4xl flex flex-col items-center gap-6 md:gap-8"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Tag */}
            <motion.div variants={fadeUpSoft}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#f97316] uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f97316] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f97316]"></span>
                </span>
                Now available in Beta
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/60 drop-shadow-sm"
            >
              Your Thoughts,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-[#ffb076]">
                Steeped to Perfection.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={fadeUpSoft}
              className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed"
            >
              The premium platform for writers who value clarity, community, and a good cup of tea. Experience writing like never before.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 mt-2 w-full justify-center"
            >
              <Link
                href="/sign-up"
                className="group flex items-center justify-center rounded-full h-14 px-8 bg-[#f97316] hover:bg-[#ea580c] text-white text-base font-bold transition-all transform hover:scale-105 shadow-[0_0_25px_rgba(249,115,22,0.4)]"
              >
                <span className="mr-2">Start Writing</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/feed"
                className="flex items-center justify-center rounded-full h-14 px-8 bg-transparent border border-white/20 hover:bg-white/5 text-white text-base font-bold transition-all"
              >
                <span className="mr-2">Explore Stories</span>
                <BookOpen className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              variants={fadeUpSoft}
              className="mt-8 md:mt-12 flex flex-col items-center gap-3"
            >
              <div className="flex -space-x-3 items-center justify-center">
                {[11, 12, 13, 14].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-[#483323] overflow-hidden relative"
                  >
                    <Image
                      src={`https://i.pravatar.cc/150?img=${i}`}
                      alt="User avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-[#f97316] flex items-center justify-center text-[10px] font-bold text-white z-10">
                  {blogCount}+
                </div>
              </div>
              <p className="text-sm font-medium text-white/40">Joined by {blogCount}+ writers</p>
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-4 md:py-6 w-full text-center text-white/20 text-xs">
          © {new Date().getFullYear()} Chai and Blogs. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
