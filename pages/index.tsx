import { signIn} from "next-auth/react";
import React, { FormEventHandler, ReactElement, ReactNode, useEffect, useState } from "react"
import DefaultLayout from "../components/layouts/DefaultLayout";
import SEO from "../components/SEO";
import SpotifyBanner from '../public/assets/Spotify_Logo_RGB_Green.png';
import AppleMusicBanner from '../public/assets/US-UK_Apple_Music_Listen_on_Lockup_RGB_blk_072720.svg';
import LastFmBanner from '../public/assets/LastFm_Logo.png';
import Image from "next/image";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import router from "next/router";
import { StreamingService } from "../utilities/interfaces";
import blackLineup from '../public/assets/blackLineup.png';
import blueLineup from '../public/assets/blueLineup.png';
import purpleLineup from '../public/assets/purpleLineup.png';

function Home() {
	const [player, setPlayer] = useState<any>(null);

	useEffect(() => {
		window.MusicKit.configure({
			developerToken: process.env.NEXT_PUBLIC_APPLE_DEVELOPER_TOKEN,
		});

		setPlayer(window.MusicKit.getInstance())
	}, []);


	const AppleMusicLogin = async () => {
		player.unauthorize();

		// Logs the player in
		player.authorize().then((key: any) => {
			signIn('applemusic', { token: key, callbackUrl: '/lineup' })
		});
	}

	const [showLastFmLogin, setShowLastFmLogin] = useState(false);
	const [lastFmUsername, setLastFmUsername] = useState('');

	const [_, setInvalidLastFm] = useState<boolean>(false);

	// Validates that a LastFm username is valid
	const HandleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();

		// Ensures that the user has entered a username
		if (/\S/.test(lastFmUsername)) {
			const response = await signIn('credentials', {
				username: lastFmUsername,
				redirect: false,
				callbackUrl: '/lineup',
			});

			// Throws error message
			if (response?.error) {
				setInvalidLastFm(true);
				return;
			}

			// Redirects user to login page
			setInvalidLastFm(false);
			router.push('/lineup');
		}
	}

	return (
		<div className=" min-h-full py-[15px]">
			{/* Search Engine Optimization */}
			<SEO
				title="MusicLineup IO"
				description="Create your own custom music graphics using your persoanlized taste in music artists and songs! Using Spotify, Apple Music, or LastFM,
				you will be edit, save, and share your musicical graphics with friends."
			/>

			{/* Header - Title of Website */}
			<h1 className="pb-[20px] flex font-semibold text-lg text-center md:text-4xl justify-center">
				<span className="flex align-middle my-auto font-display text-5xl font-bold tracking-normal text-slate-900 sm:text-7xl">All Star Music Lineup</span>
			</h1>

			{/* Container for All Items */}
			<div className="flex flex-col items-center justify-center">

				{/* Poster - Transition from All Star to Trophy Case */}
				<div className="aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px] justify-center">
					{/* Fading Images */}
					<div id="cf">
						<Image className="bottom aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px]" src={blackLineup} alt={"Black All Star Lineup"} />
						<Image className="bottom aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px]" src={blueLineup} alt={"Blue All Star Lineup"} />
						<Image className="bottom aspect-[300/320] w-[320px] sm:w-1/2 lg:max-w-[540px]" src={purpleLineup} alt={"Purple All Star Lineup"} />
					</div>
				</div>

				<div className="mt-5 mb-2 text-xl text-center md:text-2xl font-bold">Create Your Own Graphic/Playlist By Signing In</div>

				{/* Container for the Streaming Links */}
				<div className="md:flex md:flex-row gap-6 pb-4">

					{/* Login with Spotify */}
					<button className='flex bg-[#191414] h-[100px] w-full rounded-xl px-4 my-5 items-center justify-center'
						onClick={() => signIn('spotify', { callbackUrl: '/lineup' })}>
						<Image src={SpotifyBanner} width={190} alt={StreamingService.Spotify} />
					</button>

					{/* Login with Apple Music */}
					<button className='flex bg-white h-[100px] border-2 border-black w-full rounded-xl px-3 my-5 items-center justify-center'
						onClick={AppleMusicLogin}>
						<Image src={AppleMusicBanner} width={193} alt={StreamingService.AppleMusic} />
					</button>

					{/* Login with LastFm */}
					<div className='flex bg-[#E4141E] h-[100px] w-full rounded-xl px-3 my-5 items-center justify-center hover:cursor-pointer'
						onClick={() => setShowLastFmLogin(true)}>

						{/* Displays the LastFm Login if the user has selected it */}
						{!showLastFmLogin && <Image src={LastFmBanner} width={190} alt={StreamingService.LastFm} style={{ height: 'auto' }} />}

						{/* Displays form for the user to log in  */}
						{showLastFmLogin &&
							<form onSubmit={HandleSubmit} className='flex'>
								<input type="text" id="large-input"
									className="block w-3/4 p-4  text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500
                                                    dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                                                    dark:focus:ring-blue-500 dark:focus:border-blue-500"
									value={lastFmUsername ?? ''}
									placeholder={'LastFm Username'}
									onChange={e => setLastFmUsername(e.target.value)}
									maxLength={30}
								/>

								{/* Submit Button */}
								<button id="submit" type="submit"
									className="flex w-1/4 p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-600">
									<ArrowRightCircleIcon className='h-[40px] fill-white' />
								</button>
							</form>
						}
					</div>

					{/* Login with Apple Music */}
					<button className='flex bg-white h-[100px] border-2 border-black w-full rounded-xl px-3 my-5 items-center justify-center font-semibold text-xl'
						onClick={() => signIn('credentials', { username: "scratch", callbackUrl: '/lineup' })}>
						Start From Scratch
					</button>
				</div>
			</div>
		</div>
	)
}

export default Home;

Home.getLayout = (page: ReactElement): ReactNode => (
	<DefaultLayout page="home">
		{page}
	</DefaultLayout>
);
