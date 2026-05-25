import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { useCreateInquiry } from "@workspace/api-client-react";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Contact() {
  const [isSuccess, setIsSuccess] = useState(false);
  const createInquiry = useCreateInquiry();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createInquiry.mutate(
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
            <h2 className="text-3xl font-heading uppercase font-bold mb-4">Message Sent</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Thanks for reaching out. We've received your inquiry and will get back to you as soon as possible.
            </p>
            <Button onClick={() => setIsSuccess(false)} variant="outline" className="font-heading uppercase">
              Send Another Message
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-heading uppercase tracking-tight mb-4">Contact <span className="text-primary">Us</span></h1>
        <div className="h-1 w-20 bg-primary mx-auto mb-6"></div>
        <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">Have questions about our programs or facility? Send us a message and we'll get back to you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-heading uppercase tracking-wide mb-1 text-foreground">Facilities</h3>
                <p className="text-muted-foreground text-sm font-medium">Indoor & Outdoor facilities available.<br/>Contact for specific locations based on sport.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-heading uppercase tracking-wide mb-1 text-foreground">Email</h3>
                <p className="text-muted-foreground text-sm font-medium">training@mayhemathletics.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-heading uppercase tracking-wide mb-1 text-foreground">Phone</h3>
                <p className="text-muted-foreground text-sm font-medium">(555) 123-4567</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card">
            <CardHeader className="border-b border-border/50 pb-6 bg-muted/20">
              <CardTitle className="font-heading uppercase tracking-wide text-2xl">Send a Message</CardTitle>
              <CardDescription>Fill out the form below and a coach will respond shortly.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="How can we help?" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase font-heading tracking-wide text-xs text-muted-foreground">Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Type your message here..." 
                            className="resize-none bg-background min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full md:w-auto h-12 px-8 text-lg font-heading uppercase tracking-widest"
                    disabled={createInquiry.isPending}
                  >
                    {createInquiry.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
