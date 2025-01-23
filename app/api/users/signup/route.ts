import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import User from "@/lib/models/User";
import { connectToDB } from "@/lib/mongoDB";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const { name, email, password } = await req.json();
    const user = await User.findOne({ email});
    if (user) {
      console.log("already")
      return new Response("User already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password : hashedPassword});
    await newUser.save();

    console.log(name, email, hashedPassword);
    return new Response("User created successfully", { status: 201 });

  } catch (error) {
    console.log("[POST_REGISTER]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  } 
}