export interface LineupArtist {
    name: string;
    id?: string;
    uri?: string;
    image_url: string;
    popularity?: number;
    index?: number | null;
}

export enum StreamingService {
    Spotify = "spotify",
    AppleMusic = "applemusic",
    LastFm = "lastFm",
    Scratch = "scratch"
}

export const defaultArtist: LineupArtist = { name: "Add Artist", image_url: 'https://t3.ftcdn.net/jpg/01/09/84/42/360_F_109844212_NnLGUrn3RgMHQIuqSiLGlc9d419eK2dX.jpg', id: "" };