import axios from "axios";
import NextAuth, { Profile, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import SpotifyProvider from "next-auth/providers/spotify";
import CredentialsProvider from "next-auth/providers/credentials";
import * as jwt from "next-auth/jwt"
import { NextApiRequestCookies } from "next/dist/server/api-utils"
import { StreamingService } from "../../../utilities/interfaces";

export type UserSession = Session & {
  user: { provider: string };
  accessToken: string | unknown;
};

type UserProfile = Profile & { id: string };

// Spotify Authorization Scope
const scope = "user-top-read playlist-modify-public";

async function refreshAccessToken(token: JWT) {
  try {
    const url = "https://api.spotify.com/refresh";

    const response = await axios.post(url, {
      data: { refresh_token: token.refresh_token },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const refreshedTokens = response.data;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_at * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.log(error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

async function AuthorizeLastFmUser(username: string): Promise<boolean> {
  const API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;

  try {
    // Checks if the given LastFm username exists
    const response = await axios.get("http://ws.audioscrobbler.com/2.0", {
      params: {
        method: "user.getinfo",
        user: username,
        api_key: API_KEY,
        format: "json",
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.data) {
      return true;
    }

    return false;
  } catch (_) {
    return false;
  }
}

/**
 * Reads the JWT token from the next-auth session cookie, and returns the
 * session object by decoding the token. Returns null if the JWT token is absent
 * or invalid
 */
export async function getSessionFromCookie({ req, }: { req: { cookies: NextApiRequestCookies }}): Promise<UserSession | null> {
  try {
    // The cookie name differs between http and https urls. Also see here:
    // https://github.com/nextauthjs/next-auth/blob/50fe115df6379fffe3f24408a1c8271284af660b/src/core/lib/cookie.ts#L56-L60
    const isSecure = process.env.NODE_ENV === "production";
    const cookiePrefix = isSecure ? "__Secure-" : ""
    const sessionToken = req.cookies?.[`${cookiePrefix}next-auth.session-token`]

    // decode will throw when the token is invalid
    const decoded = await jwt.decode({
      token: sessionToken,
      secret: String(process.env.NEXTAUTH_SECRET!),
    })

    if (!decoded) return null;

    return {
      user: { provider: decoded.id as string, name: decoded.name},
      accessToken: decoded.accessToken || "",
      expires: String(decoded.exp)
    };

  } catch {
    return null
  }
}

export default NextAuth({
  providers: [

    // Spotify Provider
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { scope },
      },
    }),

    // LastFm / From Scratch Provider
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      type: "credentials",
      name: "credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Username" },
      },
      async authorize(credentials, req) {
        const username: string | undefined = credentials?.username;

        // Checks if the user decided to start from scratch
        if (username === StreamingService.Scratch) {
          const user = { id: "1", name: username, email: StreamingService.Scratch };
          return user;
        }

        // Checks if the username matches a valid LastFm username
        const isValid = await AuthorizeLastFmUser(username ?? "");

        if (isValid) {
          // Creates an returns LastFm user credentials
          const user: any = { id: "1", name: username, email: StreamingService.LastFm };
          return user;
        }
        else {
            // If you return null then an error will be displayed advising the user to check their details.
            throw new Error(`There was an error finding: ${username} on LastFm. Please ensure that your username is valid.`);
        }
      },
    }),

    // Apple Music Provider
    CredentialsProvider({
      type: "credentials",
      id: "applemusic",
      name: "Apple Music",
      credentials: {
        token: { label: "Token", type: "text", placeholder: "Apple Music Token" },
      },
      async authorize(credentials, req) {
        const user: any = { id: "1", name: credentials?.token, email: StreamingService.AppleMusic };
        return user;
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET!,
  pages: {
    signIn: "/",
    signOut: "/",
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },

    async session({ session, token, user }) {
      let userSession = session as UserSession;

      userSession.user.name = token.name;
      userSession.accessToken = token.accessToken;
      userSession.user.provider = token.id as string;

      return userSession;
    },

    async jwt({ token, account, profile }) {
      // Checks if the provider is from LastFM
      if (token.email === StreamingService.LastFm) {
        token.email = undefined;
        token.id = StreamingService.LastFm;
      }

      // Checks if the provider is From Scratch
      else if (token.email === StreamingService.Scratch) {
        token.email = undefined;
        token.id = StreamingService.Scratch;
      }

      // Checks if the provider is for Apple Music
      else if (token.email === StreamingService.AppleMusic) {
        token.email = undefined;
        token.id = StreamingService.AppleMusic;

        token.accessToken = token.name;
        token.name = "";
      }

      // Checks if it is from Spotify
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id = account.provider;

        const userProfile = profile as UserProfile;
        token.name = userProfile.id;

        // Adds the expiration time of the token
        if (account?.expires_at) {
          token.accessTokenExpiration = Date.now() + account?.expires_at * 1000;
        }

        // Return previous token if the access token has not expired yet
        if (token.accessTokenExpiration && Date.now() < token.accessTokenExpiration) {
          return token;
        }

        // Access token has expired, try to update it
        return refreshAccessToken(token);
      }

      return token;
    },
  },
});
