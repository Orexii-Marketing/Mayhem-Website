import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Camera, Trophy, Target, Dumbbell, ArrowRight } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";

function ImagePlaceholder({ label, className = "" }: { label: string, className?: string }) {
  return (
    <div className={`bg-muted flex flex-col items-center justify-center text-muted-foreground rounded-md border border-border/50 ${className}`}>
      <Camera className="w-8 h-8 mb-2 opacity-50" />
      <span className="font-heading uppercase tracking-wide text-sm font-semibold">{label}</span>
    </div>
  );
}

function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div className="aspect-video w-full bg-card border border-border rounded-lg flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center z-20 shadow-lg group-hover:scale-110 transition-transform">
        <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
      </div>
      <h3 className="font-heading text-xl mt-6 z-20 text-white font-semibold uppercase tracking-wide drop-shadow-md">{title}</h3>
    </div>
  );
}

export default function Home() {
  const { data: services } = useListServices();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImagePlaceholder label="Hero Training Photo" className="w-full h-full rounded-none border-none opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-3xl">
            <div className="inline-block bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-sm font-bold uppercase tracking-wider mb-6">
              Ages 8 to 12th Grade
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-heading text-white leading-[0.9] uppercase tracking-tight mb-6">
              Get to the <span className="text-primary">Next Level</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-xl mb-10 font-medium leading-relaxed">
              Not rec league. We provide intense, metric-driven training by former collegiate athletes. 
              Measurable performance improvement. None like it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg font-heading uppercase tracking-wide w-full sm:w-auto">
                  Register Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-heading uppercase tracking-wide w-full sm:w-auto bg-background/50 backdrop-blur-sm border-white/20 hover:bg-white/10 hover:text-white">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Why Mayhem */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">Why <span className="text-primary">Mayhem</span></h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Trained by Former Collegiate Athletes", desc: "Coaches who've been where your athlete wants to go", icon: Trophy },
              { title: "Metric-Driven Training", desc: "Every drill has a target. Speed, reaction time, and completion rates tracked every session", icon: Target },
              { title: "Tailored Plans", desc: "Built around your athlete, not a one-size-fits-all curriculum", icon: Dumbbell },
              { title: "Ages 8 to 12th Grade", desc: "We meet athletes at their level and push them to the next one", icon: ArrowRight },
            ].map((feature, i) => (
              <Card key={i} className="bg-background border-border/50 hover:border-primary/50 transition-colors group">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-heading uppercase tracking-wide mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground font-medium flex-1">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Training Video 1 */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <VideoPlaceholder title="Mayhem Training Highlight Reel — Coming Soon" />
        </div>
      </section>

      {/* 3. Sports Showcase & 5. Services & Pricing */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">Training <span className="text-primary">Programs</span></h2>
            <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg font-medium">
              We offer specialized training across four core sports. Choose the format that best fits your athlete's goals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {services?.map((sportData, idx) => (
              <div key={idx} className="flex flex-col">
                <ImagePlaceholder label={`${sportData.label} Training Photo`} className="w-full h-64 mb-6" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {sportData.icon}
                  </div>
                  <h3 className="text-3xl font-bold font-heading uppercase tracking-tight">{sportData.label}</h3>
                </div>
                
                <div className="space-y-4 flex-1">
                  {sportData.formats.map((format, fIdx) => (
                    <div key={fIdx} className="bg-background border border-border/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-lg">{format.name}</h4>
                        <p className="text-sm text-muted-foreground">{format.description}</p>
                      </div>
                      <div className="bg-muted px-3 py-1 rounded text-sm font-semibold whitespace-nowrap self-start sm:self-center">
                        Contact for Pricing
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) || (
              // Fallback skeleton if no data
              Array.from({length: 4}).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="w-full h-64 bg-muted animate-pulse rounded-md" />
                  <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-20 bg-muted animate-pulse rounded w-full" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 6. Photo Gallery */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">Inside <span className="text-primary">The Facility</span></h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Speed Drills", "Basketball 1-on-1", "Football Camp", "Soccer Skills", 
              "Game Day", "Group Training", "Baseball Drills", "Athlete Progress"
            ].map((label, idx) => (
              <ImagePlaceholder key={idx} label={label} className="aspect-square w-full hover:border-primary transition-colors cursor-crosshair" />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Second Video */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <VideoPlaceholder title="See Training in Action — Video Coming Soon" />
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">The <span className="text-primary">Results</span></h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "My son went from sitting the bench to starting varsity. Mayhem's intensity changed everything.",
                author: "Marcus T.",
                role: "Football Parent"
              },
              {
                quote: "The metric tracking is unreal. We can actually SEE the improvement week over week.",
                author: "Denise W.",
                role: "Basketball Parent"
              },
              {
                quote: "No other program pushes like this. My daughter is faster, stronger, and more confident.",
                author: "James R.",
                role: "Soccer Parent"
              }
            ].map((t, i) => (
              <Card key={i} className="bg-card border-border/50 relative overflow-hidden">
                <div className="absolute top-4 left-4 text-primary/20 font-heading text-8xl leading-none rotate-180">"</div>
                <CardContent className="p-8 pt-12 relative z-10">
                  <p className="text-lg font-medium mb-6 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-bold font-heading uppercase tracking-wide text-primary">{t.author}</p>
                    <p className="text-sm text-muted-foreground font-semibold">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA Banner & 10. Registration Teaser */}
      <section className="py-24 bg-primary relative overflow-hidden">
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-heading uppercase tracking-tight text-white mb-6">
            Ready to <span className="text-black">Work?</span>
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto font-medium mb-8">
            Stop wasting time with rec leagues. Join the elite and push your limits.
            Indoor and outdoor facilities available.
          </p>
          <div className="inline-block bg-black/20 text-white border border-white/30 px-4 py-2 text-sm font-bold uppercase tracking-wider mb-8 rounded backdrop-blur-sm">
            Note: Facility rental fee may be separate from training fee
          </div>
          <div className="flex justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-heading uppercase tracking-widest bg-black text-white hover:bg-black/80 hover:scale-105 transition-all">
                Register Your Athlete
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
