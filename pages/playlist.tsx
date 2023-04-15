import React, { ReactElement, ReactNode, useEffect, useState } from "react"
import DefaultLayout from "../components/layouts/DefaultLayout";
import SEO from "../components/SEO";
import Image from "next/image";
import { getSessionFromCookie } from "./api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import allstarlineup from '../public/assets/blackLineup.png';
import Link from "next/link";
import Confetti from 'react-confetti'
import { StreamingService } from "../utilities/interfaces";

function Home(link: any, provider: any) {
	// Size that will take up the confetti displayed
	const [size, setSize] = useState<any>({
		width: 0,
		height: 0
	})

	useEffect(() => {
		// Sets the window size for confetti
		setSize({ width: window.innerWidth, height: window.innerHeight });
	}, []);

	return (
		<div className=" min-h-full py-[15px]">
			{/* Search Engine Optimization */}
			<SEO
				title="Playlist"
				description="Check out your customized playlist created from the Music All Stars you selected at MusicLineup.io"
			/>

			{/* Container for All Items */}
			<div className="flex flex-col items-center justify-center" >

				{/* Poster - Transition from All Star to Trophy Case */}
				<div className="aspect-[300/320] w-[320px] bg-green-600 sm:w-1/2 lg:max-w-[540px] justify-center">
					{/* Fading Images */}
					<div id="cf">
						<Image className="bottom aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px]" src={allstarlineup} alt={"AllStarLineup"} />
						<Image className="bottom aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px]" src={allstarlineup} alt={"AllStarLineup"} />
						<Image className="bottom aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px]" src={allstarlineup} alt={"AllStarLineup"} />
					</div>
					<Confetti width={size.width} height={size.height} />
				</div>

				{/* Link To get the playlist */}
				<div className="mt-5 mb-2 text-2xl text-center md:text-3xl font-bold">
					Checkout Your Playlist <span className="text-blue-700">
						<Link href={link.link} rel="noopener noreferrer" target="_blank">Here!</Link>
					</span>
				</div>

				{link.provider === StreamingService.AppleMusic ? (
					<div className="mt-3 mb-2 text-2xl text-center md:text-3xl font-semibold">
						Library {'>'} Playlists {'>'} <b>All Star Music Lineup</b>
					</div>
				) : null}


				{/* Button to create a new playlist */}
				<div className="mt-4">
					<Link href={'/lineup'} >
						<button type="button" className="inline-block px-11 py-2 border-2 bg-red-600 border-red-600 text-white font-medium text-lg lg:text-xl leading-tight uppercase rounded hover:bg-red-400 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
						>Start Over</button>
					</Link>
				</div>
			</div>
		</div>
	)
}

export default Home;

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// Gets session details from cookie
	const session = await getSessionFromCookie(context);

	// If there is already a session, redirect the user back to lineups page
	if (!session || !context.query) {
		return {
			redirect: {
				destination: '/',
				permanent: false,
			},
		}
	}

	let link: string = "";
	let provider: string = "spotify";

	if (context.query.provider === StreamingService.Spotify) {
		link = `https://open.spotify.com/playlist/${context.query.url}`;
	}
	else if (context.query.provider === StreamingService.AppleMusic) {
		link = `https://music.apple.com/us/`;
		provider = "applemusic";
	}

	// Returns the session as a prop if it exists
	return {
		props: {
			link: link,
			provider: provider
		},
	};
}

Home.getLayout = (page: ReactElement): ReactNode => (
	<DefaultLayout page="home">
		{page}
	</DefaultLayout>
);
