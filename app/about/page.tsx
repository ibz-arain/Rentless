'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { 
  Handshake, 
  FileText, 
  Search as SearchIcon, 
  Building, 
  Users, 
  GraduationCap, 
  Code, 
  Linkedin,
  MapPin,
  HeartHandshake,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section with Background */}
        <section 
          className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: "url('/images/fall-trees.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
          <div className="relative z-10 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Changing How People
                <br />
                <span className="text-primary-foreground">Find Home</span>
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                No agents. No annoying documents. No hidden listings. Just real connections between real people.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
        </section>

        {/* Mission Statement - Split Layout */}
        <section className="pt-16 md:py-32 bg-background relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-block mb-6">
                    <span className="text-primary font-semibold text-lg uppercase tracking-wider">Our Mission</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                    A Platform Built for Real People
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    We're tired of the same old rental game. Endless paperwork, middlemen taking cuts, and listings that never seem authentic. That's why we built Rentless differently.
                  </p>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    Our platform is completely free and designed to connect property owners directly with people looking for their next home. No agents, no hidden fees, no BS.
                  </p>
                  <ul className="space-y-4">
                    {[
                      "Directly deal with landlords",
                      "Hidden listings you won't find anywhere else",
                      "Complete platform from searching to booking",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-lg">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <div 
                      className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5"
                      style={{
                        backgroundImage: "url('/images/neighbourhood.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-primary p-6 rounded-xl shadow-xl hidden lg:block">
                    <div className="text-white">
                      <div className="text-3xl font-bold">$0</div>
                      <div className="text-sm opacity-90">Forever Free</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story - Split with Visual */}
        <section className="py-16 md:py-32 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-7xl mx-auto">


              <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                <div className="relative order-2 lg:order-1">
                  <div 
                    className="aspect-square rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                      backgroundImage: "url('/images/ambassador-bridge.jpg')",
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t rounded-2xl from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="h-5 w-5" />
                        <span className="font-semibold">Windsor, Ontario</span>
                      </div>
                      <p className="text-white/90">Home of the University of Windsor</p>
                    </div>
                  </div>
                  <div className="absolute -top-6 -left-6 bg-primary p-6 rounded-xl shadow-xl hidden lg:block">
                    <GraduationCap className="h-12 w-12 text-primary-foreground" />
                  </div>
                </div>

                <div className="order-1 lg:order-2 space-y-6">
                <div className="mb-6">
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Born from Experience
                </h2>
              </div>
                  <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">

                    <p>
                      After watching people we know struggle to find places to live, we knew something had to change. The traditional rental market wasn't serving newcomers, students, or young professionals the way it should.
                    </p>
                    <p className="text-foreground font-medium">
                      So we decided to build a better solution.
                    </p>
                    <p>
                      Rentless was born from the countless stories we heard from friends, classmates, and members of our community. We wanted to create a platform that was free, accessible, and actually worked for everyone.
                    </p>
                  </div>
                  
                  <div className="pt-6">
                    <Button size="lg" className="px-8 group" asChild>
                      <Link href="/properties">
                        Start Your Search
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-32 bg-primary">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3">
                  The Team
                </h2>

              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Team Member 1 */}
                <div className="relative text-center p-8 rounded-xl bg-card border border-border shadow-sm">
                  <Link
                    href="https://ibrahimarain.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Visit Ibrahim's website"
                  >
                    <ArrowUpRight className="h-6 w-6 text-primary hover:scale-110 transition-transform" />
                  </Link>
                  <div className="relative w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-2 border-border/50">
                    <Image 
                      src="/images/ibrahim.png" 
                      alt="Software Developer" 
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Ibrahim Arain
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Software Developer
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    Building the tech that powers Rentless.
                  </p>
                  <Link href="https://www.linkedin.com/in/ibz-arain/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </Link>
                </div>

                {/* Team Member 2 */}
                <div className="text-center p-8 rounded-xl bg-card border border-border shadow-sm">
                  <div className="relative w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-2 border-border/50">
                    <Image 
                      src="/images/sahaj.jpeg" 
                      alt="Real Estate Agent & Developer" 
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Sahaj Kataria
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Real Estate Agent & Developer
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    Bridging real estate expertise with modern tech.
                  </p>
                  <Link href="https://www.linkedin.com/in/sahaj-kataria/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-4 w-4" />
                    <span>LinkedIn</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        
      </main>

      <Footer />
    </div>
  )
}
