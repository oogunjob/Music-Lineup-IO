import axios from "axios";
import { GetArtistName } from "../default";
import { LineupArtist } from "../interfaces";

const KanyeWestImageURL = "https://scottwoodsmakeslists.files.wordpress.com/2016/12/kanye-west-3.jpg?w=1012&h=1349&crop=1";

export async function FetchSpotifyLineup(access_token: string | unknown): Promise<LineupArtist[][]> {
  const time_ranges: string[] = ["long_term", "medium_term", "short_term"];

  const lineups = await Promise.all(time_ranges.map(time_range =>
      axios.get("https://api.spotify.com/v1/me/top/artists", {
            params: { time_range: time_range, limit: 5, offset: 0 },
            headers: {
            Accept: "application/json",
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json",
            },
          })
          .then(response => { // make sure it went well
            if (response.status !== 200) throw new Error();
            return response.data.items;
          })
        )
      )
    .then(ranges => ranges
      .map((subArray) => {
        return subArray.map((artist: any) => {
          return { name: GetArtistName(artist.name), id: artist.id, image_url: artist.name === 'Kanye West' ? KanyeWestImageURL : artist.images[1].url, popularity: artist.popularity, uri: artist.external_urls.spotify ?? '' };
        }).sort((a: LineupArtist, b: LineupArtist) => b.popularity! - a.popularity!);
      })
    )
    .catch(_ => [])

    return lineups;
}

export async function CreateSpotifyPlaylist(access_token: string | unknown, user_id: string | unknown, lineupName: string, lineup: LineupArtist[]){
      const songs = await Promise.all(lineup.map(artist =>
        axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks`, {
              params: { "market": "US" },
              headers: {
              Accept: "application/json",
              Authorization: "Bearer " + access_token,
              "Content-Type": "application/json",
              },
            })
            .then(response => {
              if (response.status !== 200) throw new Error();
              return response.data.tracks;
            })
          )
        )
      .catch(_ => []);

      // List of Tracks that will be included in playlist
      const tracks: any = [];

      // Adds each song to an array
      songs.forEach(song => {
        song.forEach((track: any) => {
          tracks.push(track.uri)
        })
      })

      // Randomizes the tracks in the array
      tracks.sort(() => Math.random() - 0.5);

      const playlistId = await axios.post(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
              "name": `${lineupName !== "" ? lineupName.concat("'s") : ""} All Star Music Lineup`,
              "public": true,
              "collaborative": false,
              "description": "Playlist of your Music All Stars created at MusicLineup.io"
            }, {
              headers: {
                  'Authorization': `Bearer ${access_token}`,
              },
          })
          .then(function(response) {
              // Returns the playlist Id
              return response.data.id;
          })
          .catch(function(_) {
              return null;
      });

      if (playlistId !== null) {
          await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            "uris": tracks,
          }, {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        })
        .then(function(response) {
            // Returns the playlist Id
            return response.data.id;
        })
        .catch(function(_) {
            return null;
        });
      }

      return playlistId;
}

export async function FetchSpotifySearchResults(access_token: string | unknown, query: string): Promise<LineupArtist[]> {
    const response = await axios.get("https://api.spotify.com/v1/search", {
          params: {
            q: query,
            limit: 10,
            type: 'artist',
            market: 'US',
            offset: 0
          },
          headers: {
          Accept: "application/json",
          Authorization: "Bearer " + access_token,
          "Content-Type": "application/json",
          },
        })
        .then(response => { // make sure it went well
          if (response.status !== 200) throw new Error();
          return response.data.artists.items;
        })
    .catch(_ => [])

    const searchResults: LineupArtist[] = [];

    if(response.length > 0) {
        // Extract the name, Spotify Id, Image URL, and popularity rank for each artist
        for (const artist of response) {
            searchResults.push({
                name: GetArtistName(artist.name),
                id: artist.id,
                image_url: artist.name === "Kanye West" ? KanyeWestImageURL : artist.images[1]?.url ?? '/assets/QuestionMark.jpg',
                popularity: artist.popularity ?? 0,
                uri: artist.external_urls.spotify ?? ''
            });
        }
    }

    return searchResults;
}