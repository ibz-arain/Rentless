import { 
  Globe, Coffee, Wifi, Car, Tv, Waves, Trees, Lock, 
  UtensilsCrossed, Shirt, Fan, Dumbbell, 
  Snowflake, Flame, Warehouse, Sofa, DoorClosed, 
  Trash2, Lightbulb, Wind, Camera, Dog, Baby, 
  Gamepad2, ShowerHead, Blinds, Armchair, Bath, Building2,
  Cigarette, Key, ChefHat, ParkingCircle, Footprints, Home,
  Utensils, Music, ShoppingBag, Bus, BookOpen,
  Flower, Box, Sandwich, Soup, BedDouble,
  Bath as BathIcon, HeartPulse, Shirt as ShirtIcon
} from 'lucide-react';

export const AMENITIES_CONFIG = {
  categories: {
    essentials: {
      title: 'Essentials',
      items: {
        wifi: { label: 'WiFi', icon: Wifi },
        tv: { label: 'TV', icon: Tv },
        heating: { label: 'Heating', icon: Flame },
        ac: { label: 'Air Conditioning', icon: Snowflake },
        workspace: { label: 'Workspace', icon: Warehouse },
        kitchen: { label: 'Kitchen', icon: UtensilsCrossed }
      }
    },
    features: {
      title: 'Features',
      items: {
        washer: { label: 'Washer', icon: Shirt },
        dryer: { label: 'Dryer', icon: Wind },
        dishwasher: { label: 'Dishwasher', icon: UtensilsCrossed },
        refrigerator: { label: 'Refrigerator', icon: Box },
        microwave: { label: 'Microwave', icon: UtensilsCrossed },
        coffee_maker: { label: 'Coffee Maker', icon: Coffee }
      }
    },
    location: {
      title: 'Location',
      items: {
        free_parking: { label: 'Free Parking', icon: ParkingCircle },
        paid_parking: { label: 'Paid Parking', icon: Car },
        street_parking: { label: 'Street Parking', icon: Car },
        elevator: { label: 'Elevator', icon: Building2 },
        doorman: { label: 'Doorman', icon: DoorClosed },
        gym: { label: 'Gym', icon: Dumbbell },
        public_transit: { label: 'Public Transit', icon: Bus }
      }
    },
    outdoors: {
      title: 'Outdoors',
      items: {
        balcony: { label: 'Balcony', icon: Footprints },
        patio: { label: 'Patio', icon: Trees },
        bbq_grill: { label: 'BBQ Grill', icon: Flame },
        garden: { label: 'Garden', icon: Flower },
        waterfront: { label: 'Waterfront', icon: Waves },
        pool: { label: 'Pool', icon: Waves },
        roof_access: { label: 'Roof Access', icon: Building2 }
      }
    },
    bedroom: {
      title: 'Bedroom & Laundry',
      items: {
        king_bed: { label: 'King Bed', icon: BedDouble },
        queen_bed: { label: 'Queen Bed', icon: Sofa },
        walk_in_closet: { label: 'Walk-in Closet', icon: DoorClosed },
        blackout_shades: { label: 'Blackout Shades', icon: Blinds }
      }
    },
    bathroom: {
      title: 'Bathroom',
      items: {
        bathtub: { label: 'Bathtub', icon: BathIcon },
        shower: { label: 'Shower', icon: ShowerHead },
        heated_floors: { label: 'Heated Floors', icon: Snowflake }
      }
    },
    entertainment: {
      title: 'Entertainment',
      items: {
        hot_tub: { label: 'Hot Tub', icon: Bath },
        indoor_fireplace: { label: 'Fireplace', icon: Flame },
        pool_table: { label: 'Pool Table', icon: Gamepad2 },
        sound_system: { label: 'Sound System', icon: Music }
      }
    },
    safety: {
      title: 'Safety',
      items: {
        smoke_alarm: { label: 'Smoke Alarm', icon: Camera },
        carbon_monoxide_alarm: { label: 'CO Alarm', icon: Camera },
        fire_extinguisher: { label: 'Fire Extinguisher', icon: Flame },
        security_system: { label: 'Security System', icon: Lock },
        smart_lock: { label: 'Smart Lock', icon: Key }
      }
    },
    accessibility: {
      title: 'Accessibility',
      items: {
        step_free_access: { label: 'Step-free Access', icon: Footprints },
        accessible_bathroom: { label: 'Accessible Bathroom', icon: BathIcon },
        accessible_parking: { label: 'Accessible Parking', icon: Car }
      }
    },
    rules: {
      title: 'House Rules',
      items: {
        pets_allowed: { label: 'Pets Allowed', icon: Dog },
        smoking_allowed: { label: 'Smoking Allowed', icon: Cigarette },
        events_allowed: { label: 'Events Allowed', icon: Home },
        long_term_stays: { label: 'Long Term Stays', icon: Home }
      }
    }
  }
}; 