'use client'
import Link from 'next/link'

export const Footer = () => {
  return (
    <footer className="bg-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Help Center</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Tenant Guide</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Lease Information</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Property Owners</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">List Your Property</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Landlord Resources</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Property Management</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Rental Guides</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Market Reports</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Neighborhood Info</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex justify-between items-center flex-wrap gap-4">
            <p className="text-muted-foreground">&copy; 2024 Rentless. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-muted-foreground hover:text-primary">Privacy</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">Terms</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">Sitemap</Link>
            </div>
          </div>
        </div>
      </footer>
  )
}