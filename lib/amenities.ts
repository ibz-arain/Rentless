import { Globe, Coffee } from 'lucide-react';

export const AMENITIES_CONFIG = {
  categories: {
    interior: {
      title: 'Interior',
      items: {
        airConditioning: { label: 'Air Conditioning', icon: Globe },
        dishwasher: { label: 'Dishwasher', icon: Coffee },
        washer: { label: 'Washer', icon: Coffee },
        dryer: { label: 'Dryer', icon: Coffee },
        // Add more amenities as needed
      }
    },
    exterior: {
      title: 'Exterior',
      items: {
        parking: { label: 'Parking', icon: Globe },
        balcony: { label: 'Balcony', icon: Globe },
        // Add more amenities as needed
      }
    }
  }
}; 