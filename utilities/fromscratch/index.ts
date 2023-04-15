import axios from "axios";
import { GetArtistName } from "../default";
import { LineupArtist } from "../interfaces";

export async function FetchFromScratchSearchResults(query: string): Promise<LineupArtist[]> {
    // Deezer Authorization token
    const API_KEY = process.env.NEXT_PUBLIC_DEEZER_API_KEY!;

    try {
        let searchResults: LineupArtist[] = [];

        // Creates request to Spotify to get user's current top 10 artists
        const response = await axios.get(`https://deezerdevs-deezer.p.rapidapi.com/search`, {
            params: { q: query, limit: 5 },
            headers: {
              "X-RapidAPI-Key": API_KEY,
              "X-RapidAPI-Host": "deezerdevs-deezer.p.rapidapi.com",
            },
          }
        );

        if(response && response.data) {
            const artists = response.data.data;

            artists.forEach((artist: any) => {
                searchResults.push({
                  name: GetArtistName(artist.artist.name),
                  uri: artist.artist.link,
                  image_url: artist.artist.picture_big,
                });
            });
        }

        return searchResults;

    } catch (_) {
        // Handles any exceptions thrown from making request
        return [];
    }
}
