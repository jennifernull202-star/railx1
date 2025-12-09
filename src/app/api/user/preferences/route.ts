import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select("preferences");

    return NextResponse.json({
      showSellerSection: user?.preferences?.showSellerSection ?? true,
      showContractorSection: user?.preferences?.showContractorSection ?? true,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT update user preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { showSellerSection, showContractorSection } = body;

    await dbConnect();
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          "preferences.showSellerSection": showSellerSection ?? true,
          "preferences.showContractorSection": showContractorSection ?? true,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences: {
        showSellerSection: user.preferences?.showSellerSection ?? true,
        showContractorSection: user.preferences?.showContractorSection ?? true,
      },
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
