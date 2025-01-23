"use client";

import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { LayoutDashboard, CheckSquare, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const router = useRouter();
  const {toast} = useToast();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/users/logout", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast({ description: "Logged out successfully" });
        router.push("/login");
      } else {
        console.error("Failed to logout");
        toast({
          title: "Error",
          description: "Failed to logout. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="hidden md:flex items-center space-x-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">TaskMaster</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-md font-medium hover:text-primary transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/tasks"
              className="flex items-center space-x-2 text-md font-medium hover:text-primary transition-colors"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Task List</span>
            </Link>
          </nav>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="md:inline-flex"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
