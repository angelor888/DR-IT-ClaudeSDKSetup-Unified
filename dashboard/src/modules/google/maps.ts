// Google Maps API service (using direct API, not OAuth)
import axios from 'axios';
import { PlaceDetails, DirectionsResult } from './types';
import { logger } from '../../utils/logger';

const log = logger.child('MapsService');

export class MapsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(apiKey: string = process.env.GOOGLE_MAPS_API_KEY || '') {
    this.apiKey = apiKey;
  }

  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{
    lat: number;
    lng: number;
    formatted_address: string;
    place_id: string;
  } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
        };
      }

      return null;
    } catch (error) {
      log.error('Failed to geocode address', error);
      throw error;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<{
    formatted_address: string;
    place_id: string;
    address_components: any[];
  } | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components,
        };
      }

      return null;
    } catch (error) {
      log.error('Failed to reverse geocode', error);
      throw error;
    }
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'place_id,formatted_address,name,geometry,address_components,types,url,vicinity,website,formatted_phone_number,opening_hours,photos,rating,reviews,user_ratings_total',
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      return null;
    } catch (error) {
      log.error('Failed to get place details', error);
      throw error;
    }
  }

  // Search places nearby
  async searchPlacesNearby(options: {
    location: { lat: number; lng: number };
    radius: number;
    type?: string;
    keyword?: string;
  }): Promise<PlaceDetails[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${options.location.lat},${options.location.lng}`,
          radius: options.radius,
          type: options.type,
          keyword: options.keyword,
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK') {
        return response.data.results;
      }

      return [];
    } catch (error) {
      log.error('Failed to search places nearby', error);
      throw error;
    }
  }

  // Get directions
  async getDirections(options: {
    origin: string | { lat: number; lng: number };
    destination: string | { lat: number; lng: number };
    waypoints?: Array<string | { lat: number; lng: number }>;
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    avoid?: Array<'tolls' | 'highways' | 'ferries' | 'indoor'>;
    units?: 'metric' | 'imperial';
    departure_time?: Date | 'now';
    arrival_time?: Date;
  }): Promise<DirectionsResult | null> {
    try {
      const origin = typeof options.origin === 'string'
        ? options.origin
        : `${options.origin.lat},${options.origin.lng}`;
      
      const destination = typeof options.destination === 'string'
        ? options.destination
        : `${options.destination.lat},${options.destination.lng}`;

      const params: any = {
        origin,
        destination,
        mode: options.mode || 'driving',
        units: options.units || 'metric',
        key: this.apiKey,
      };

      if (options.waypoints && options.waypoints.length > 0) {
        params.waypoints = options.waypoints
          .map(wp => typeof wp === 'string' ? wp : `${wp.lat},${wp.lng}`)
          .join('|');
      }

      if (options.avoid && options.avoid.length > 0) {
        params.avoid = options.avoid.join('|');
      }

      if (options.departure_time) {
        params.departure_time = options.departure_time === 'now'
          ? 'now'
          : Math.floor(options.departure_time.getTime() / 1000);
      }

      if (options.arrival_time) {
        params.arrival_time = Math.floor(options.arrival_time.getTime() / 1000);
      }

      const response = await axios.get(`${this.baseUrl}/directions/json`, { params });

      if (response.data.status === 'OK') {
        return response.data;
      }

      return null;
    } catch (error) {
      log.error('Failed to get directions', error);
      throw error;
    }
  }

  // Calculate distance matrix
  async getDistanceMatrix(options: {
    origins: Array<string | { lat: number; lng: number }>;
    destinations: Array<string | { lat: number; lng: number }>;
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    units?: 'metric' | 'imperial';
    avoid?: Array<'tolls' | 'highways' | 'ferries' | 'indoor'>;
    departure_time?: Date | 'now';
  }): Promise<{
    rows: Array<{
      elements: Array<{
        distance?: { text: string; value: number };
        duration?: { text: string; value: number };
        duration_in_traffic?: { text: string; value: number };
        status: string;
      }>;
    }>;
  } | null> {
    try {
      const origins = options.origins
        .map(o => typeof o === 'string' ? o : `${o.lat},${o.lng}`)
        .join('|');
      
      const destinations = options.destinations
        .map(d => typeof d === 'string' ? d : `${d.lat},${d.lng}`)
        .join('|');

      const params: any = {
        origins,
        destinations,
        mode: options.mode || 'driving',
        units: options.units || 'metric',
        key: this.apiKey,
      };

      if (options.avoid && options.avoid.length > 0) {
        params.avoid = options.avoid.join('|');
      }

      if (options.departure_time) {
        params.departure_time = options.departure_time === 'now'
          ? 'now'
          : Math.floor(options.departure_time.getTime() / 1000);
      }

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, { params });

      if (response.data.status === 'OK') {
        return response.data;
      }

      return null;
    } catch (error) {
      log.error('Failed to get distance matrix', error);
      throw error;
    }
  }

  // Validate address
  async validateAddress(address: string): Promise<{
    isValid: boolean;
    formattedAddress?: string;
    coordinates?: { lat: number; lng: number };
    confidence?: number;
  }> {
    try {
      const geocoded = await this.geocodeAddress(address);
      
      if (!geocoded) {
        return { isValid: false };
      }

      // Check if the result is precise enough
      const placeDetails = await this.getPlaceDetails(geocoded.place_id);
      const isPrecise = placeDetails?.types?.some(type => 
        ['street_address', 'premise', 'subpremise', 'room'].includes(type)
      );

      return {
        isValid: true,
        formattedAddress: geocoded.formatted_address,
        coordinates: { lat: geocoded.lat, lng: geocoded.lng },
        confidence: isPrecise ? 1.0 : 0.7,
      };
    } catch (error) {
      log.error('Failed to validate address', error);
      return { isValid: false };
    }
  }

  // Get travel time between locations
  async getTravelTime(
    origin: string | { lat: number; lng: number },
    destination: string | { lat: number; lng: number },
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving',
    departureTime?: Date | 'now'
  ): Promise<{
    distance: string;
    duration: string;
    duration_in_traffic?: string;
  } | null> {
    try {
      const directions = await this.getDirections({
        origin,
        destination,
        mode,
        departure_time: departureTime,
      });

      if (directions && directions.routes.length > 0) {
        const route = directions.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          duration_in_traffic: (leg as any).duration_in_traffic?.text,
        };
      }

      return null;
    } catch (error) {
      log.error('Failed to get travel time', error);
      throw error;
    }
  }

  // Helper to format address from Jobber property
  formatJobberAddress(property: {
    address?: {
      street1?: string;
      street2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  }): string {
    if (!property.address) return '';
    
    const parts = [
      property.address.street1,
      property.address.street2,
      property.address.city,
      property.address.province,
      property.address.postalCode,
      property.address.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}