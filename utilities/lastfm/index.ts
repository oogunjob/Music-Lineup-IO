import axios from "axios";
import { GetArtistName } from "../default";
import { LineupArtist } from "../interfaces";

export async function FetchLastFmLineup(username: string): Promise<LineupArtist[][]> {
  // LastFm Authorization token
  const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;

  const time_ranges: string[] = ["1month", "6month", "overall"];

  const lineups = await Promise.all(
    time_ranges.map((time_range) =>
      axios
        .get("http://ws.audioscrobbler.com/2.0", {
          params: {
            method: "user.gettopartists",
            user: username,
            period: time_range,
            api_key: API_KEY,
            limit: 5,
            format: "json",
          },
        })
        .then((response) => {
          // make sure it went well
          if (response.status !== 200) throw new Error();
          return response.data.topartists.artist;
        })
    )
  )
    .then((ranges) =>
      ranges.map((subArray) => {
        return subArray.map((artist: any) => {
          return {
            name: GetArtistName(artist.name),
            uri: artist.url,
            image_url: artist.image[3]["#text"],
          };
        });
      })
    )
    .catch((_) => []);

  return lineups;
}

export async function FetchLastFmSearchResults(query: string): Promise<LineupArtist[]> {
  // LastFm Authorization token
  const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY!;
  try {
    let searchResults: LineupArtist[] = [];

    // Creates request to Spotify to get user's current top 10 artists
    const response = await axios.get(
      `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${query}&api_key=${API_KEY}&limit=5&format=json`
    );

    // console.log(response)

    const artists = response.data.results.artistmatches.artist;
    artists.forEach((artist: any) => {
      searchResults.push({
        name: GetArtistName(artist.name),
        uri: artist.url,
        image_url: artist.image[3]["#text"],
      });
    });

    return searchResults;

  } catch (_) {
    // Handles any exceptions thrown from making request
    return [];
  }
}
