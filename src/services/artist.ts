import { config } from '../config';
import { getAuthToken } from './auth';
import type { Artist, ArtistProfile, ArtistService, ArtistAvailabilityResponse } from '../types';

export const artistService = {
    fetchArtists: async (): Promise<Artist[]> => {
        try {
            const token = getAuthToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'x-api-key': config.X_API_KEY,
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`; // Corrected typo here manually if my mental model had one, code below is clean.
            }
            const tokenStr = token ? `Bearer ${token}` : '';
            if (token) headers['Authorization'] = tokenStr;


            const response = await fetch(`${config.API_BASE_URI}/api/planner/artists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.X_API_KEY,
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
            });

            if (!response.ok) {
                // Fallback or throw? User provided successful JSON example, assume it works.
                throw new Error(`Failed to fetch artists: ${response.statusText}`);
            }

            const data = await response.json();
            return data.artists || [];
        } catch (error) {
            console.error("Error fetching artists:", error);
            throw error;
        }
    },

    getArtistById: async (id: string): Promise<ArtistProfile> => {
        try {
            const token = getAuthToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'x-api-key': config.X_API_KEY,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const response = await fetch(`${config.API_BASE_URI}/api/planner/artists/${id}`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch artist profile: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to fetch artist');

            return data;
        } catch (error) {
            console.error("Error fetching artist profile:", error);
            throw error;
        }
    },

    getArtistServices: async (artistId: string): Promise<ArtistService[]> => {
        try {
            const token = getAuthToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'x-api-key': config.X_API_KEY,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const response = await fetch(`${config.API_BASE_URI}/api/planner/artist/${artistId}/services`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch artist services: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to fetch artist services');

            return data.services || [];
        } catch (error) {
            console.error("Error fetching artist services:", error);
            throw error;
        }
    },

    checkArtistAvailability: async (
        artistId: string,
        serviceId: string,
        startDate: string,
        endDate: string,
        startTime?: string,
        endTime?: string
    ): Promise<ArtistAvailabilityResponse> => {
        try {
            const token = getAuthToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'x-api-key': config.X_API_KEY,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const params = new URLSearchParams({
                serviceId,
                startDate,
                endDate,
                ...(startTime ? { startTime } : {}),
                ...(endTime ? { endTime } : {})
            });

            const response = await fetch(
                `${config.API_BASE_URI}/api/planner/artist/${artistId}/price?${params.toString()}`,
                {
                    method: 'GET',
                    headers,
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to check artist availability and price: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Failed to check availability and price');

            return data;
        } catch (error) {
            console.error("Error checking artist availability and price:", error);
            throw error;
        }
    }
};
