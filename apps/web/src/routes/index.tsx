import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Github,
  Globe,
  Shield,
  Sparkles,
  Twitter,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white antialiased">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 bg-gradient-to-b from-violet-600/20 via-purple-600/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] bg-gradient-to-l from-blue-600/10 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-white/5 border-b bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link className="flex items-center gap-2" to="/">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-lg">SaaS Template</span>
              </Link>
              <div className="hidden items-center gap-6 md:flex">
                <a
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                  href="#features"
                >
                  Features
                </a>
                <a
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                  href="#pricing"
                >
                  Pricing
                </a>
                <a
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                  href="#"
                >
                  Docs
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="bg-white font-medium text-black hover:bg-zinc-200">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      className="text-zinc-400 hover:bg-white/5 hover:text-white"
                      variant="ghost"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="bg-white font-medium text-black hover:bg-zinc-200">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <span className="text-zinc-400">
                Production-ready SaaS template
              </span>
              <ChevronRight className="h-3 w-3 text-zinc-500" />
            </div>

            {/* Headline */}
            <h1 className="mb-6 max-w-4xl font-bold text-5xl leading-[1.1] tracking-tight md:text-7xl">
              <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                Build your next SaaS
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                in record time
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mb-10 max-w-2xl text-lg text-zinc-400 leading-relaxed md:text-xl">
              A production-ready SaaS starter kit with authentication, payments,
              teams, and everything you need to launch faster.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button
                    className="h-12 bg-white px-8 font-medium text-base text-black hover:bg-zinc-200"
                    size="lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button
                    className="h-12 bg-white px-8 font-medium text-base text-black hover:bg-zinc-200"
                    size="lg"
                  >
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                className="h-12 border-white/10 bg-white/5 px-8 text-base text-white hover:bg-white/10"
                size="lg"
                variant="outline"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-16 flex flex-col items-center gap-4">
              <p className="text-sm text-zinc-500">Trusted by teams at</p>
              <div className="flex items-center gap-8 opacity-50">
                {["Vercel", "Stripe", "Linear", "Notion", "Figma"].map(
                  (company) => (
                    <span
                      className="font-semibold text-lg text-zinc-400"
                      key={company}
                    >
                      {company}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1">
            <div className="rounded-lg bg-[#0f0f10] p-2">
              <div className="mb-4 flex items-center gap-2 px-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex flex-1 justify-center">
                  <div className="flex h-6 w-64 items-center justify-center rounded-md bg-white/5">
                    <span className="text-xs text-zinc-500">
                      app.saas-template.io
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex aspect-[16/9] items-center justify-center rounded-md bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/30">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                    <BarChart3 className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-sm text-zinc-500">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-white/5 border-t px-6 py-20" id="features">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl md:text-4xl">
              Everything you need to ship
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400">
              Powerful features designed to help you build, launch, and scale
              your SaaS product.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
                key={feature.title}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-600/10">
                  <feature.icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-white/5 border-t px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div className="text-center" key={stat.label}>
                <div className="mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text font-bold text-4xl text-transparent md:text-5xl">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-white/5 border-t px-6 py-20" id="pricing">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-zinc-400">
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                className={`relative rounded-xl border p-6 ${
                  plan.popular
                    ? "border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-transparent"
                    : "border-white/5 bg-white/[0.02]"
                }`}
                key={plan.name}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-500 px-3 py-1 font-medium text-xs">
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-zinc-500">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="font-bold text-4xl">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-zinc-500">/month</span>
                  )}
                </div>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      className="flex items-center gap-2 text-sm text-zinc-400"
                      key={feature}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  className="block"
                  to={isAuthenticated ? "/dashboard" : "/login"}
                >
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-white text-black hover:bg-zinc-200"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Get started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-white/5 border-t px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">
            {isAuthenticated ? "Welcome back!" : "Ready to start building?"}
          </h2>
          <p className="mb-8 text-lg text-zinc-400">
            {isAuthenticated
              ? "Continue where you left off."
              : "Get started with the most complete SaaS starter kit available."}
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/login"}>
            <Button
              className="h-12 bg-white px-8 font-medium text-base text-black hover:bg-zinc-200"
              size="lg"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start for free"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-white/5 border-t px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg">SaaS Template</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a className="transition-colors hover:text-white" href="#">
                Privacy
              </a>
              <a className="transition-colors hover:text-white" href="#">
                Terms
              </a>
              <a className="transition-colors hover:text-white" href="#">
                Contact
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                className="text-zinc-500 transition-colors hover:text-white"
                href="#"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                className="text-zinc-500 transition-colors hover:text-white"
                href="#"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-zinc-600">
            © {new Date().getFullYear()} SaaS Template. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Zap,
    title: "Authentication Ready",
    description:
      "Email/password, social login, magic links, and 2FA built-in with Better Auth. Enterprise SSO ready.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Role-based access control, audit logging, and admin panel included out of the box.",
  },
  {
    icon: BarChart3,
    title: "Beautiful Dashboard",
    description:
      "Modern, responsive dashboard with charts, tables, and widgets built with shadcn/ui.",
  },
  {
    icon: Users,
    title: "Multi-Tenancy",
    description:
      "Organizations, teams, invitations, and member management ready to go.",
  },
  {
    icon: Globe,
    title: "Payments Integrated",
    description:
      "Polar.sh integration for subscriptions, billing portal, and webhook handling.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description:
      "Multi-provider AI integration with OpenAI, Anthropic, and Google. Langfuse observability included.",
  },
];

const stats = [
  { value: "100+", label: "Components included" },
  { value: "10+", label: "Integrations" },
  { value: "TypeScript", label: "End-to-end" },
  { value: "MIT", label: "License" },
];

const plans = [
  {
    name: "Starter",
    description: "For individuals",
    price: "$0",
    features: [
      "Up to 3 team members",
      "Basic features",
      "Community support",
      "API access",
    ],
  },
  {
    name: "Pro",
    description: "For growing teams",
    price: "$29",
    popular: true,
    features: [
      "Unlimited team members",
      "Advanced features",
      "Priority support",
      "Custom integrations",
      "Analytics dashboard",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "Custom SLAs",
      "SSO & SAML",
      "On-premise deployment",
    ],
  },
];
