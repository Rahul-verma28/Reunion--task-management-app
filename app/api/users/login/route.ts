import User from "@/lib/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { connectToDB } from "@/lib/mongoDB";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      return new NextResponse("User does not exists", { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return new NextResponse("Invalid Password", { status: 401 });
    }

    const tokenData = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    const response = NextResponse.json({
      message: "Logged In Success",
      success: true,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
    });

    return response;
    
  } catch (error) {
    console.log("[POST_LOGIN]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}