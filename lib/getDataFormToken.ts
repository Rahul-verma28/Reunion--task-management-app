import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const getDataFromToken = (request: NextRequest): string | NextResponse => {
  // Extract the token from cookies
  const token = request.cookies.get("token")?.value || "";

  if (!token) {
    return NextResponse.json(
      { message: "Token not found in cookies." },
      { status: 401 }
    );
  }

  try {
    // Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);

    if (!(decodedToken as jwt.JwtPayload)?.id) {
      return NextResponse.json(
        { message: "Invalid token or missing user ID." },
        { status: 400 }
      );
    }

    return (decodedToken as jwt.JwtPayload).id; // Return the user ID if valid
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error extracting data from token:", error.message);
    } else {
      console.error("Error extracting data from token:", error);
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
