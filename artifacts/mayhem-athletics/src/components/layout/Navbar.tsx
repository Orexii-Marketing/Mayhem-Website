import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src="/mayhem-logo.jpg"
            alt="Mayhem Athletics"
            className="h-10 w-auto rounded-sm object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/">
            <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              Home
            </span>
          </Link>
          <Link href="/contact">
            <span className={`text-sm font-medium transition-colors hover:text-primary ${location === "/contact" ? "text-primary" : "text-muted-foreground"}`}>
              Contact
            </span>
          </Link>
          <Link href="/register">
            <Button className="font-heading uppercase tracking-wide">Register Now</Button>
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background py-4 px-4 flex flex-col gap-4">
          <Link href="/">
            <span onClick={toggleMobileMenu} className="block text-lg font-heading uppercase text-foreground hover:text-primary">Home</span>
          </Link>
          <Link href="/contact">
            <span onClick={toggleMobileMenu} className="block text-lg font-heading uppercase text-foreground hover:text-primary">Contact</span>
          </Link>
          <Link href="/register">
            <Button className="w-full font-heading uppercase tracking-wide mt-2" onClick={toggleMobileMenu}>Register Now</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
