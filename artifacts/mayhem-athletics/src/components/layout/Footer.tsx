import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <img
                src="/mayhem-logo.jpg"
                alt="Mayhem Athletics"
                className="h-16 w-auto rounded-sm object-contain"
              />
            </Link>
            <p className="text-muted-foreground max-w-sm mt-2 font-medium">
              Intense, metric-driven training for serious young athletes. Get to the next level.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading text-lg font-semibold uppercase mb-4 text-foreground">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Home</span>
                </Link>
              </li>
              <li>
                <Link href="/register">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Register</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">Contact</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-lg font-semibold uppercase mb-4 text-foreground">Contact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>training@mayhemathletics.com</li>
              <li>(555) 123-4567</li>
              <li className="mt-4 pt-4 border-t border-border/50">
                <span className="block text-sm">Indoor & Outdoor facilities available.</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mayhem Athletics. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary">Instagram</a>
            <a href="#" className="text-muted-foreground hover:text-primary">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
