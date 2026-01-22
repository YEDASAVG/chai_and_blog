import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import LandingPage from "@/components/LandingPage";

async function getBlogCount() {
  await dbConnect();
  return await Blog.countDocuments({ status: "published" });
}

export default async function Home() {
  const { userId } = await auth();

  // If logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  const blogCount = await getBlogCount();

  return <LandingPage blogCount={blogCount} />;
}
