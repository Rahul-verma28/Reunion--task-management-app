import {  NextResponse } from "next/server";

export async function GET() {
  try {
    const response = NextResponse.json({
      message: "Logout Successfully",
      success: true,
    });
    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    return response;

  } catch (error) {
    console.log("[LOGOUT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
