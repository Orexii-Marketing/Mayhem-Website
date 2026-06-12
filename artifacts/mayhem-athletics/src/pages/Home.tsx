import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, Dumbbell, ArrowRight } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";

// TODO: swap in real testimonials and set to true when ready
const SHOW_TESTIMONIALS = false;

export default function Home() {
  const { data: services } = useListServices();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section — split layout */}
      <section className="flex flex-col md:flex-row md:h-[560px] lg:h-[600px]">

        {/* Left: text panel */}
        <div className="flex flex-col justify-center bg-background px-6 md:px-10 lg:px-16 py-10 md:py-0 md:w-[44%] shrink-0 order-2 md:order-1">
          <div className="inline-block bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 w-fit">
            Ages 8 to 12th Grade
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-white leading-[0.88] uppercase tracking-tight mb-5">
            Get to the{' '}
            <span className="text-primary">Next<br />Level</span>
          </h1>
          <p className="text-base md:text-lg text-gray-300 max-w-sm mb-8 font-medium leading-relaxed">
            Not rec league. Intense, metric-driven training by former collegiate athletes.
            Measurable performance improvement. None like it.
          </p>
          <div className="flex flex-row gap-3 flex-wrap">
            <Link href="/register">
              <Button size="lg" className="h-12 px-7 text-base font-heading uppercase tracking-wide">
                Register Now <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base font-heading uppercase tracking-wide border-white/20 hover:bg-white/10 hover:text-white">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: photo panel */}
        <div className="relative w-full md:w-[56%] h-[260px] md:h-full order-1 md:order-2 overflow-hidden">
          <img
            src="/team-photo-2.png"
            alt="Mayhem Athletics team"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent md:hidden" />
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

      {/* TODO: add training highlight reel video */}

      {/* 3. Training Programs */}
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
                    </div>
                  ))}
                </div>
              </div>
            )) || (
              Array.from({length: 4}).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-20 bg-muted animate-pulse rounded w-full" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Photo Gallery */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">Our <span className="text-primary">Athletes</span></h2>
            <div className="h-1 w-20 bg-primary mx-auto"></div>
          </div>

          {/* 4-photo grid — restructured from 8-slot to show available real photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Large feature photo — spans full width on mobile, left on desktop */}
            <div className="md:row-span-2 overflow-hidden rounded-xl border border-border/50 hover:border-primary transition-colors">
              <img
                src="/team-photo-1.jpg"
                alt="Mayhem Athletics soccer team"
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                style={{ minHeight: "300px", maxHeight: "520px" }}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-border/50 hover:border-primary transition-colors aspect-[4/3]">
              <img
                src="/photos/team-winter.jpg"
                alt="Winter league soccer team"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-border/50 hover:border-primary transition-colors aspect-[4/3]">
              <img
                src="/photos/team-action.png"
                alt="Mayhem Athletics team game day"
                className="w-full h-full object-cover object-bottom hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TODO: add training in action video */}

      {/* 5. Testimonials — hidden until real testimonials are collected */}
      {SHOW_TESTIMONIALS && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">The <span className="text-primary">Results</span></h2>
              <div className="h-1 w-20 bg-primary mx-auto"></div>
            </div>

            {/* TODO: replace with real parent testimonials */}
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
      )}

      {/* 6. CTA Banner */}
      <section className="py-24 bg-primary relative overflow-hidden">
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
