import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCreateRegistration, useListServices, RegistrationInputSport, RegistrationInputSkillLevel } from "@workspace/api-client-react";
import { useState } from "react";

const formSchema = z.object({
  parentName: z.string().min(2, "Parent name is required"),
  athleteName: z.string().min(2, "Athlete name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  sport: z.nativeEnum(RegistrationInputSport, { required_error: "Please select a sport" }),
  trainingFormat: z.string().min(1, "Please select a training format"),
  ageOrGrade: z.string().min(1, "Age or grade is required"),
  skillLevel: z.nativeEnum(RegistrationInputSkillLevel, { required_error: "Please select a skill level" }),
  notes: z.string().optional(),
});

export default function Register() {
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: services } = useListServices();
  const createRegistration = useCreateRegistration();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentName: "",
      athleteName: "",
      email: "",
      phone: "",
      sport: undefined,
      trainingFormat: "",
      ageOrGrade: "",
      skillLevel: undefined,
      notes: "",
    },
  });

  const selectedSport = form.watch("sport");
  const availableFormats = services?.find(s => s.sport === selectedSport)?.formats || [];

  function onSubmit(values: z.infer<typeof formSchema>) {
    createRegistration.mutate(
      { data: values },
      {
        onSuccess: () => {
          setIsSuccess(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      }
    );
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl min-h-[70vh] flex flex-col justify-center">
        <Card className="border-primary/50 bg-card">
          <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-heading uppercase font-bold mb-4">Registration Received</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              We've received your registration request. A Mayhem Athletics coach will contact you shortly to complete enrollment and schedule the first session.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="font-heading uppercase">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">Athlete <span className="text-primary">Registration</span></h1>
        <div className="h-1 w-20 bg-primary mb-6"></div>
        <p className="text-muted-foreground text-lg font-medium">Complete the form below to begin the enrollment process. Spots are limited.</p>
      </div>

      <Alert className="mb-8 border-primary/50 bg-primary/5">
        <AlertCircle className="h-5 w-5 text-primary" />
        <AlertTitle className="font-heading uppercase tracking-wide text-primary">Important Notice</AlertTitle>
        <AlertDescription className="font-medium text-foreground">
          Note: Facility rental fee may be required separately from coaching fees depending on the location and format chosen.
        </AlertDescription>
      </Alert>

      <Card className="border-border/50 bg-card">
        <CardHeader className="border-b border-border/50 pb-6 bg-muted/20">
          <CardTitle className="font-heading uppercase tracking-wide text-2xl">Athlete Information</CardTitle>
          <CardDescription>Enter details for the athlete joining Mayhem Athletics.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Parent/Guardian Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="athleteName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Athlete Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ageOrGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Age or Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10th Grade" className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Current Skill Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(RegistrationInputSkillLevel).map(level => (
                            <SelectItem key={level} value={level} className="capitalize">
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Primary Sport</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("trainingFormat", ""); // Reset format when sport changes
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(RegistrationInputSport).map(sport => (
                            <SelectItem key={sport} value={sport} className="capitalize">
                              {sport}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainingFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Training Format</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedSport}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={selectedSport ? "Select format" : "Select sport first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableFormats.length > 0 ? (
                            availableFormats.map(f => (
                              <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="Individual (1-on-1)">Individual (1-on-1)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Additional Notes / Goals (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What specific areas are you looking to improve?" 
                        className="resize-none bg-background min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Teaser Section */}
              <div className="bg-muted p-6 rounded-lg border border-border/50 mt-8">
                <div className="flex items-start gap-4">
                  <div className="bg-background p-2 rounded border border-border mt-1">
                    <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold font-heading uppercase tracking-wide mb-1">Secure Payment</h4>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">Online payment integration coming soon. For now, submit your registration and we will contact you to arrange payment and finalize enrollment.</p>
                    <Button disabled className="w-full sm:w-auto font-heading uppercase tracking-widest bg-muted-foreground text-background">
                      Pay & Register — Coming Soon
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-heading uppercase tracking-widest shadow-lg shadow-primary/20"
                disabled={createRegistration.isPending}
              >
                {createRegistration.isPending ? "Submitting..." : "Submit Registration Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
