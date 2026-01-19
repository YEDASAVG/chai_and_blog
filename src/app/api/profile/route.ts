import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET current user's profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let user = await User.findOne({ clerkId: userId }).lean();

    // If user doesn't exist in MongoDB, create from Clerk data
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const newUser = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.firstName || clerkUser.username || "User",
        username: clerkUser.username || clerkUser.id.slice(0, 12),
        avatar: clerkUser.imageUrl,
      });

      user = newUser.toObject();
    }

    return NextResponse.json({
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio || "",
      github: user.github || "",
      linkedin: user.linkedin || "",
      twitter: user.twitter || "",
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT update user's profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, github, linkedin, twitter } = body;

    await dbConnect();

    let user = await User.findOne({ clerkId: userId });

    // If user doesn't exist, create from Clerk data first
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: name || clerkUser.firstName || clerkUser.username || "User",
        username: clerkUser.username || clerkUser.id.slice(0, 12),
        avatar: clerkUser.imageUrl,
        bio,
        github,
        linkedin,
        twitter,
      });
    } else {
      // Update fields (only update if provided)
      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (github !== undefined) user.github = github;
      if (linkedin !== undefined) user.linkedin = linkedin;
      if (twitter !== undefined) user.twitter = twitter;

      await user.save();
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio || "",
        github: user.github || "",
        linkedin: user.linkedin || "",
        twitter: user.twitter || "",
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
