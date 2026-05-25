import { Router } from "express";

const router = Router();

const SPORTS_SERVICES = [
  {
    sport: "football",
    label: "Football",
    icon: "🏈",
    formats: [
      {
        id: "football-individual",
        name: "Individual (1-on-1)",
        description: "Tailored one-on-one sessions focused on your athlete's specific position, skills, and metrics.",
        price: null,
        duration: "60 min",
      },
      {
        id: "football-group",
        name: "Group Training",
        description: "Small-group sessions building teamwork, communication, and position-specific drills.",
        price: null,
        duration: "90 min",
      },
      {
        id: "football-3on3",
        name: "3-on-3",
        description: "Competitive small-sided games to sharpen decision-making and execution under pressure.",
        price: null,
        duration: "90 min",
      },
      {
        id: "football-clinic",
        name: "Skills Clinic",
        description: "Intensive multi-athlete clinic covering routes, agility, footwork, and measurable performance targets.",
        price: null,
        duration: "2 hrs",
      },
    ],
  },
  {
    sport: "soccer",
    label: "Soccer",
    icon: "⚽",
    formats: [
      {
        id: "soccer-individual",
        name: "Individual (1-on-1)",
        description: "Personalized sessions targeting dribbling, shooting, passing accuracy, and footwork speed.",
        price: null,
        duration: "60 min",
      },
      {
        id: "soccer-group",
        name: "Group Training",
        description: "Team-oriented drills building chemistry, positioning, and collective execution.",
        price: null,
        duration: "90 min",
      },
      {
        id: "soccer-3on3",
        name: "3-on-3",
        description: "Fast-paced small-sided matches to develop creativity, speed, and composure on the ball.",
        price: null,
        duration: "90 min",
      },
      {
        id: "soccer-clinic",
        name: "Skills Clinic",
        description: "High-intensity clinic with tracked metrics — sprint times, touch counts, and finishing accuracy.",
        price: null,
        duration: "2 hrs",
      },
    ],
  },
  {
    sport: "basketball",
    label: "Basketball",
    icon: "🏀",
    formats: [
      {
        id: "basketball-individual",
        name: "Individual (1-on-1)",
        description: "Focused sessions on ball handling, shooting form, footwork, and defensive positioning.",
        price: null,
        duration: "60 min",
      },
      {
        id: "basketball-group",
        name: "Group Training",
        description: "Team drills, pick-and-roll execution, transition offense, and defensive schemes.",
        price: null,
        duration: "90 min",
      },
      {
        id: "basketball-3on3",
        name: "3-on-3",
        description: "Competitive half-court play developing reads, spacing, and shot selection under game pressure.",
        price: null,
        duration: "90 min",
      },
      {
        id: "basketball-clinic",
        name: "Skills Clinic",
        description: "Comprehensive skill-building clinic with shot percentage tracking and reaction time drills.",
        price: null,
        duration: "2 hrs",
      },
    ],
  },
  {
    sport: "baseball",
    label: "Baseball",
    icon: "⚾",
    formats: [
      {
        id: "baseball-individual",
        name: "Individual (1-on-1)",
        description: "Personalized work on hitting mechanics, pitching form, fielding, and measurable velocity gains.",
        price: null,
        duration: "60 min",
      },
      {
        id: "baseball-group",
        name: "Group Training",
        description: "Team-focused sessions on situational play, baserunning, and defensive coordination.",
        price: null,
        duration: "90 min",
      },
      {
        id: "baseball-3on3",
        name: "3-on-3",
        description: "Small-sided competitive scenarios to sharpen instincts and in-game decision-making.",
        price: null,
        duration: "90 min",
      },
      {
        id: "baseball-clinic",
        name: "Skills Clinic",
        description: "Data-driven clinic tracking exit velocity, spin rate, fielding range, and sprint times.",
        price: null,
        duration: "2 hrs",
      },
    ],
  },
];

router.get("/services", (_req, res) => {
  res.json(SPORTS_SERVICES);
});

export default router;
