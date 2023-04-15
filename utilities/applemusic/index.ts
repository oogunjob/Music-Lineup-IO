import axios from "axios";
import { GetArtistName } from "../default";
import { defaultArtist, LineupArtist } from "../interfaces";

const KanyeWestImageURL = "https://scottwoodsmakeslists.files.wordpress.com/2016/12/kanye-west-3.jpg?w=1012&h=1349&crop=1";

export async function FetchAppleMusicLineup(access_token: string | unknown): Promise<LineupArtist[][]> {

    // Checks that the Apple Music access token exists
    if (access_token) {
        const token = access_token as string;

        // Fetchs all artists in the user's library
        const lineupArtists: LineupArtist[][] = await axios.get("https://api.music.apple.com/v1/me/recent/played", {
            headers: {
            Accept: "application/json",
            Authorization: "Bearer " + process.env.NEXT_PUBLIC_APPLE_DEVELOPER_TOKEN,
            'Music-User-Token': token,
            "Content-Type": "application/json",
          },
        }).then(response => {
            if (response.status !== 200) throw new Error();
            const names: any[] = [];

            // Checks the user's most recently played songs in their library
            response.data.data.forEach((element: any) => {
                // Stores all artists names in an array and strips out '&' if there is
                if(element.type === 'albums') {
                    names.push(element.attributes.artistName.replace(/&/g, ""))
                }
            });

            names.sort((a, b) => 0.5 - Math.random());
            let unique = names.filter((item, index) => names.indexOf(item) === index);
            const artists = unique.slice(0, 5);

            return artists;
        })
        .then(async artists => {
            // Fetches the artist metadata
            const artistResults = await Promise.all(
            artists.map(async name => {
                const result = await FetchAppleMusicSearchResults(token, name, 1);
                return result[0] ?? defaultArtist;
          })
        );
        const result: LineupArtist[][] = [artistResults];
        const lineups = result.filter(artist => artist !== undefined);

        return lineups;
      })
        .catch(_ => [])
        return lineupArtists;
    }

    return [];
}

export async function CreateAppleMusicPlaylist(access_token: string | unknown, lineup: LineupArtist[], name: string) {

    // Checks that the Apple Music access token exists
    if (access_token) {
        const token = access_token as string;

        // Searches for 10 songs from each artist in the linep
        const songs = await Promise.all(
            lineup.map((artist) =>
                axios.get(`https://api.music.apple.com/v1/catalog/us/search`, {
                    params: {
                        term: artist.name,
                        types: "songs",
                        limit: 10,
                    },
                    headers: {
                        Accept: "application/json",
                        Authorization:
                        "Bearer " + process.env.NEXT_PUBLIC_APPLE_DEVELOPER_TOKEN,
                        "Music-User-Token": token,
                        "Content-Type": "application/json",
                    },
                })
                .then((response) => {
                    if (response.status !== 200) throw new Error();
                    return response.data.results.songs.data;
                })
            )
        )
        .catch((_) => []);

        // Array that will hold the tracks from all the music all stars
        const tracks: any[] = [];

        // Adds each song that was discovered to the complete list of songs
        songs.forEach((song) => {
            song.forEach((track: any) => {
                tracks.push({
                    id: track.id,
                    type: "songs",
                });
            });
        });

        // Randomizes the tracks in the array
        tracks.sort(() => Math.random() - 0.5);

        // Makes the request to create a playlist with the music all stars
        const playlistId = await axios.post("https://api.music.apple.com/v1/me/library/playlists", {
            attributes: {
                description: "Playlist of your Music All Stars created at MusicLineup.io",
                name: `${name !== "" ? name.concat("'s ") : "" }All Star Music Lineup`,
                },
            relationships: {
                tracks: {
                    data: tracks,
                },
            },
          },
          {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_APPLE_DEVELOPER_TOKEN}`,
                "Music-User-Token": token,
            },
          }
        )
        .then(function (response) {
            // Returns the playlist Id
            return response.data.data[0].id;
        })
        .catch(function (_) {
          return null;
        });

        return playlistId;
    }

    return null;
}

export async function FetchAppleMusicSearchResults(access_token: string | unknown, query: string, limit: number): Promise<LineupArtist[]> {

    // Checks that the Apple Music access token exists
    if (access_token) {
        const token = access_token as string;
        const response = await axios.get("https://api.music.apple.com/v1/catalog/us/search", {
            params: {
                term: query,
                limit: limit,
                types: 'artists',
            },
            headers: {
                "Accept": "application/json",
                Authorization: "Bearer " + process.env.NEXT_PUBLIC_APPLE_DEVELOPER_TOKEN,
                "Content-Type": "application/json",
                'Music-User-Token': token
            },
        })
        .then(response => {
            if (response.status !== 200) throw new Error();
            return response.data.results.artists.data;
        })
        .catch(_ => [])

        const searchResults: LineupArtist[] = [];

        if(response.length > 0) {
            // Extract the name, Spotify URI, Image URL, and popularity rank for each artist
            for (const artist of response) {
                searchResults.push({
                    name: GetArtistName(artist.attributes.name),
                    uri: artist.attributes.url,
                    image_url: artist.attributes.name === "Kanye West" ? KanyeWestImageURL : (artist.attributes.artwork?.url.replace("{w}", artist.attributes.artwork.height))?.replace("{h}", artist.attributes.artwork.height) ?? '/assets/QuestionMark.jpg',
                });
            }
        }

        return searchResults;
    }

    return [];
}