import dbConnect from "@/lib/db";
import Blog from "@/models/Blog";
import LandingPage from "@/components/LandingPage";

async function getBlogCount() {
  await dbConnect();
  return await Blog.countDocuments({ status: "published" });
}

export default async function Home() {
  // Auth redirect for logged-in users is handled in middleware (faster)
  const blogCount = await getBlogCount();

  return <LandingPage blogCount={blogCount} />;
}
