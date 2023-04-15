import { GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import Image, { StaticImageData } from "next/image";
import React, { FormEventHandler, Fragment, ReactElement, ReactNode, useEffect, useRef, useState } from "react"
import { getSessionFromCookie, UserSession } from "./api/auth/[...nextauth]";
import DefaultLayout from "../components/layouts/DefaultLayout";
import SpotifyBanner from '../public/assets/Spotify_Logo_RGB_Green.png';
import AppleMusicBanner from '../public/assets/US-UK_Apple_Music_Listen_on_Lockup_RGB_blk_072720.svg';
import LastFmBanner from '../public/assets/LastFm_Logo.png';
import DeezerBanner from '../public/assets/DeezerBanner.png';
import DeezerWhiteBanner from '../public/assets/Deezer_Logo_RVB_White.svg';
import SEO from "../components/SEO";
import { MusicalNoteIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Dialog, Transition } from "@headlessui/react";
import * as htmlToImage from 'html-to-image';
import { FetchFromScratchSearchResults } from "../utilities/fromscratch";
import { defaultArtist, LineupArtist, StreamingService } from "../utilities/interfaces";
import { FetchLastFmSearchResults, FetchLastFmLineup } from "../utilities/lastfm";
import { FetchSpotifySearchResults, FetchSpotifyLineup, CreateSpotifyPlaylist } from "../utilities/spotify";
import { CreateAppleMusicPlaylist, FetchAppleMusicLineup, FetchAppleMusicSearchResults } from "../utilities/applemusic";
import { useRouter } from 'next/router';
import html2canvas from "html2canvas";
import domtoimage from 'dom-to-image';

type TimeRange = "Last-Month" | "Six-Months" | "All-Time";
type ThemeDisplay = "Black" | "Blue" | "Purple" | "Brown";

function Lineup({ name, lineups }: { name: string | null | undefined, lineups: LineupArtist[][] }) {
    const { data: session } = useSession();
    const userSession = session as UserSession;

    const router = useRouter();

    // Dom element for downloading the image graphic
    const domEl = useRef(null);

    // Saves the playlist
    const SavePlaylist = async () => {
        if (userSession?.user?.provider! !== StreamingService.Spotify && userSession?.user?.provider! !== StreamingService.AppleMusic) {
            alert("You must sign in with a Spotify or Apple Music account to save your playlist.");
            return;
        }

        // Filters out any add new artists from the lineup
        const uniqueLineup = currentLineup.filter(function (artist) {
            return artist.name !== defaultArtist.name;
        });

        // Saves Spotify Playlist
        if (userSession?.user?.provider! === StreamingService.Spotify) {
            const playlistUrl = await CreateSpotifyPlaylist(userSession?.accessToken, session?.user?.name, lineupName, uniqueLineup);

            if (playlistUrl !== null) {
                router.push(`playlist?provider=spotify&url=${playlistUrl}`);
            }
            else {
                alert("Could not save your playlist. Please sign out and try again.")
            }
        }

        // Saves Apple Music Playlist
        else if (userSession?.user?.provider! === StreamingService.AppleMusic) {
            const playlistUrl = await CreateAppleMusicPlaylist(userSession?.accessToken, uniqueLineup, lineupName);

            if (playlistUrl !== null) {
                router.push(`playlist?provider=${StreamingService.AppleMusic}`);
            }
            else {
                alert("Could not save your playlist. Please sign out and try again.")
            }
        }
    };

    // Function to download and share the image
    const ShareImage = async () => {

        if (navigator.share && domEl.current) {

            htmlToImage.toPng(domEl.current!, { pixelRatio: 1.5 }).then(async dataUrl => {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                const filesArray = [new File([blob!], 'allstarlineup.png', { type: blob!.type, lastModified: new Date().getTime() })];

                const data = { files: filesArray, text: "Check Out My All Star Music Lineup! #MusicLineupIO" };

                await navigator.share(data);
            });
        }
    }

    const defaultArray = Array<LineupArtist>(5).fill(defaultArtist);

    // Indicates the artist that is selected to be switched
    const [selectedArtist, setSelectedArtist] = useState<number | null>(null);

    // Lineup name
    const [lineupName, setLineupName] = useState<string>(name !== "" && name !== null && name !== undefined ? name : "");

    // The available time ranges that can be selected for Spotify and LastFm Users
    const [timeRange, setTimeRange] = useState<TimeRange>("All-Time");

    const [isOpen, setIsOpen] = useState(false)

    function closeModal() {
        setIsOpen(false)
    }

    function openModal() {
        setIsOpen(true)
    }

    // The selected theme of the lineup backdrop
    const [theme, setTheme] = useState<ThemeDisplay>("Blue");

    const [query, setQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<LineupArtist[]>([]);

    // Guarantees the lineup is filled with 5 players
    const FillLineup = (lineup: LineupArtist[]) => {
        if (lineup && lineup.length < 5) {
            for (var i = 0; i < (5 - lineup.length); i++) {
                lineup.push(defaultArtist);
            }
        }
        return lineup;
    }

    // Current Lineup that is being displayed
    const [currentLineup, setCurrentLineup] = useState(FillLineup(lineups[0]) ?? defaultArray);

    // Updates the current lineup whenever the time range changes
    useEffect(() => {
        switch (timeRange) {
            case "All-Time":
                setCurrentLineup(FillLineup(lineups[0]) ?? defaultArray);
                break;

            case "Six-Months":
                setCurrentLineup(FillLineup(lineups[1]) ?? defaultArray);
                break;

            case "Last-Month":
                setCurrentLineup(FillLineup(lineups[2]) ?? defaultArray);
                break;
        }
    }, [timeRange]);

    function GetPresenterImage(streamingService: string): StaticImageData {
        switch (streamingService) {
            case StreamingService.Spotify:
                return SpotifyBanner;

            case StreamingService.AppleMusic:
                return AppleMusicBanner;

            case StreamingService.LastFm:
                return LastFmBanner;

            default:
                return DeezerBanner;
        }
    }

    function GetPresenterUrl(streamingService: string): string {
        switch (streamingService) {
            case StreamingService.Spotify:
                return 'https://open.spotify.com/';

            case StreamingService.AppleMusic:
                return 'https://music.apple.com/us/browse';

            case StreamingService.LastFm:
                return 'https://www.last.fm/home';

            default:
                return 'https://www.deezer.com/us/'
        }
    }

    const HandleSelect = (index: number) => {
        // Adds new artist to the list
        if (selectedArtist !== null && isOpen && currentLineup[selectedArtist].name === defaultArtist.name) {
            let updatedLineup = [...currentLineup];
            updatedLineup[selectedArtist] = searchResults[index];

            setCurrentLineup(updatedLineup);
            setSelectedArtist(null);
            setSearchResults([]);
            closeModal();
        }

        // If the selected artist is the same, unselect the artist
        else if (selectedArtist !== null && selectedArtist === index) {
            setSelectedArtist(null);
        }

        // Substitute artists
        else if (selectedArtist !== null && selectedArtist !== index) {
            let updatedLineup = [...currentLineup];
            const temp = currentLineup[selectedArtist]
            updatedLineup[selectedArtist] = updatedLineup[index];
            updatedLineup[index] = temp;

            setCurrentLineup(updatedLineup);
            setSelectedArtist(null);
        }

        // Indicates that a new artist has been selected
        else {
            setSelectedArtist(index);

            // Check here if the artist is a new artist and display a modal to add the new artist
            if (currentLineup[index].name === defaultArtist.name) setIsOpen(true);
        }
    };

    const HandleRemove = () => {
        if (selectedArtist !== null) {
            let updatedLineup = [...currentLineup];
            updatedLineup[selectedArtist] = defaultArtist;

            setCurrentLineup(updatedLineup);
            setSelectedArtist(null);
        }
    };

    const HandleSearch: FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();

        // Ensures that the user has entered a username
        if (/\S/.test(query)) {
            const userSession = session as UserSession;
            let results: LineupArtist[] = [];

            if (userSession.user.provider === StreamingService.Spotify) {
                results = await FetchSpotifySearchResults(userSession?.accessToken, query);
            }
            else if (userSession.user.provider === StreamingService.AppleMusic) {
                results = await FetchAppleMusicSearchResults(userSession?.accessToken, query, 5);
            }
            else if (userSession.user.provider === StreamingService.LastFm) {
                results = await FetchLastFmSearchResults(query);
            }
            else if (userSession.user.provider === StreamingService.Scratch) {
                results = await FetchFromScratchSearchResults(query);
            }

            setSearchResults(results);
        }
    }

    return (
        <div className="flex justify-center min-h-full py-[15px]">
            <SEO
                title="Lineup"
                description="Personalized music lineups based on your listening habits over the past several months.
                Music stats are provided by your streaming service of choice between Spotify, Apple Music, and Last FM."
            />

            <div id="container" className="grid grid-cols-1 gap-2 md:grid-cols-2 gap-x-10">

                {/* Instructions */}
                <div className="flex flex-col item-center content-center">
                    <h1 className="text-xl lg:text-2xl text-center font-semibold pb-1">Instructions</h1>
                    <h1 className="lg:pb-4 lg:text-xl text-center font-semibold lg:pt-3">&#9733; Select an artist to remove or replace</h1>
                    <h1 className="lg:pb-4 lg:text-xl text-center font-semibold">&#9733; Edit order by selecting two artists</h1>
                    <h1 className="lg:pb-4 lg:text-xl text-center font-semibold">&#9733; Save Playlist and Share With Friends !</h1>
                </div>

                {/* Headline For Streaming Service */}
                <div className="w-[350px] lg:min-w-[550px] py-2 row-start-2">
                    <div className="flex items-center justify-center gap-2 h-full my-auto col-start-">
                        <span className="font-semibold lg:text-2xl">All Star Lineup Presented By</span>
                        <a href={GetPresenterUrl(userSession?.user?.provider!)} target='_blank' rel="noopener noreferrer">
                            <Image src={GetPresenterImage(userSession?.user?.provider!)} alt={userSession?.user?.provider! ?? 'MusicStreamingService'}
                                style={{
                                    background: userSession?.user?.provider! === StreamingService.Spotify ? 'black' : userSession?.user?.provider! === StreamingService.LastFm ? '#E4141E' : 'transparent',
                                    paddingTop: userSession?.user?.provider! === StreamingService.Spotify ? '8px' : '', paddingBottom: userSession?.user?.provider! === StreamingService.Spotify ? '8px' : ''
                                }}
                                className='px-2 rounded-2xl w-[100px] lg:w-[150px]'
                            />
                        </a>
                    </div>
                </div>

                {/* Tab Group (Spotify, LastFm) - Switch Between Last Month, Last 6 Months, and All Time  */}
                {(userSession?.user?.provider! === StreamingService.Spotify || userSession?.user?.provider! === StreamingService.LastFm) &&
                    <div className="col-start-1 w-[350px] lg:min-w-[550px]">
                        <div className="flex items-center justify-center">
                            <div className="inline-flex" role="group">
                                <button
                                    type="button"
                                    className="rounded-l px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs lg:text-lg leading-tight uppercase hover:bg-black hover:bg-opacity-5
                                focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
                                    style={{ backgroundColor: timeRange === "Last-Month" ? '#e9e9e9' : 'transparent' }}
                                    onClick={() => setTimeRange("Last-Month")}>
                                    Last Month
                                </button>
                                <button
                                    type="button"
                                    className=" px-6 py-2 border-t-2 border-b-2 border-blue-600 text-blue-600 font-medium text-xs lg:text-lg leading-tight uppercase hover:bg-black hover:bg-opacity-5
                                focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
                                    style={{ backgroundColor: timeRange === "Six-Months" ? '#e9e9e9' : 'transparent' }}
                                    onClick={() => setTimeRange("Six-Months")}>
                                    Last 6 Months
                                </button>
                                <button
                                    type="button"
                                    className="rounded-r px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs lg:text-lg leading-tight uppercase hover:bg-black hover:bg-opacity-5
                                focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
                                    style={{ backgroundColor: timeRange === "All-Time" ? '#e9e9e9' : 'transparent' }}
                                    onClick={() => setTimeRange("All-Time")}>
                                    All-Time
                                </button>
                            </div>
                        </div>
                    </div>
                }

                {/* Lineup */}
                <div id='domEl' ref={domEl} className={`relative col-start-1 w-[350px] lg:min-w-[550px] bg-gray-300 aspect-[300/335] theme-${theme}`}>

                    {/* Spotify Image On Poster */}
                    {userSession?.user?.provider! === StreamingService.Spotify &&
                        <div className="absolute bottom-3 right-3 text-white">
                            <Image src={SpotifyBanner} alt='Spotify Logo' className="w-[60px] lg:w-[100px]" />
                        </div>
                    }

                    {/* Deezer Image On Poster */}
                    {userSession?.user?.provider! === StreamingService.Scratch &&
                        <div className="absolute bottom-3 right-3 text-white">
                            <Image src={DeezerWhiteBanner} alt='Deezer Logo' className="w-[60px] lg:w-[100px]" />
                        </div>
                    }

                    {/* Starting Lineup - Text Box */}
                    <div className="absolute flex w-[15%] h-full">
                        <span className="text-[26px] lg:text-[37px] font-cutmark uppercase rotate-180 align-middle m-auto " style={{ writingMode: 'vertical-rl', wordSpacing: '8px' }}>
                            {lineupName !== "" ? lineupName.concat("'s") : ""} All Star Music Lineup
                        </span>
                    </div>

                    {/* Created At MusicLineup.io - Text Box */}
                    <div className="absolute right-0 text-white flex h-full">
                        <span className="text-[12px] lg:text-[20px] uppercase rotate-180 align-middle m-auto " style={{ writingMode: 'vertical-rl', wordSpacing: '8px' }}>
                            Created at MusicLineup.io
                        </span>
                    </div>

                    {/* Starting Lineup - Artists Images Box */}
                    <div className="absolute left-[15%] w-[25%] h-full grid grid-rows-5">
                        {currentLineup.map((artist, index) =>
                            <div key={index} className={`w-full h-full hover:cursor-pointer ${index === selectedArtist ? 'border-2 border-r-0 border-red-700' : ''}`} onClick={() => HandleSelect(index)}>
                                <img src={artist.image_url} className='w-full h-full pointer-events-none' alt={artist.name} />
                            </div>
                        )
                        }
                    </div>

                    {/* Starting Lineup - Artists Names Box */}
                    <div className="absolute left-[40%] w-[60%] h-full grid grid-rows-5">
                        {currentLineup.map((artist, index) =>
                            <div key={index} className={`max-w-full h-full hover:cursor-pointer flex flex-col justify-center ${index === selectedArtist ? 'border-2 border-l-0 border-red-700' : ''}`} onClick={() => HandleSelect(index)}>

                                {/* Artist First Name */}
                                <span className="pl-4 w-full text-3xl text-white lg:text-[40px] lg:leading-[44px] font-cutmark" >
                                    {artist.name.split(' ').length > 1 ? artist.name.split(' ')[0] : ""}
                                </span>

                                {/* Artist Second Name */}
                                <span className="pl-4 w-full text-3xl text-white lg:text-[40px] lg:leading-[44px] font-cutmark" >
                                    {artist.name.split(' ').length > 1 ? artist.name.split(' ').slice(1).join(" ") : artist.name}
                                </span>
                            </div>
                        )
                        }
                    </div>

                    {/* X Icons for Removing an artist */}
                    <div className="absolute left-[75%] w-[25%] h-full grid grid-rows-5">
                        {currentLineup.map((_, index) =>
                            <div key={index} className={`w-[100%] pr-2 flex flex-row gap-1 h-full hover:cursor-pointer ${index === selectedArtist ? 'border-blue-400' : ''}`} onClick={() => HandleSelect(index)}>
                                {/* {index === selectedArtist ? currentLineup[selectedArtist].name !== defaultArtist.name ? <Link href={} rel="noopener noreferrer" target="_blank"><MusicalNoteIcon className="fill-[#c8102e] w-full h-full" /></Link> : '' : ''} */}
                                {index === selectedArtist ? currentLineup[selectedArtist].name !== defaultArtist.name ? <a target="_blank" rel="noopener noreferrer" href={currentLineup[selectedArtist].uri ?? ''}><MusicalNoteIcon className="fill-[#c8102e] w-[38px] lg:w-full h-full" /></a> : '' : ''}
                                {index === selectedArtist ? currentLineup[selectedArtist].name !== defaultArtist.name ? <XCircleIcon className="fill-[#c8102e] w-[38px] lg:w-full h-full" onClick={() => HandleRemove()} /> : '' : ''}
                            </div>
                        )
                        }
                    </div>
                </div>

                {/* Customization */}
                <div className="aspect-[300/335] w-[350px] lg:min-w-[550px] md:col-start-2 px-3">

                    {/* Header */}
                    <div className="text-2xl lg:text-3xl font-bold tracking-normal text-slate-900 pb-4">Customize Your Lineup</div>

                    {/* TODO: AFTER SPOTIFY REVIEW, CHANGE BACK TO JUSTIFY-BETWEEN */}
                    <div className="flex flex-col lg:h-5/6 lg:gap-y-10">
                        {/* Text Box For Lineup Name */}
                        <div className="pb-3">
                            <h1 className="text-xl font-semibold pb-1">Enter Your Name</h1>
                            <input type="text" id="large-input" className="block w-4/5 p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Enter Your Lineup Name" maxLength={11} value={lineupName} onChange={e => setLineupName(e.target.value)} />
                        </div>

                        {/* Theme Customization */}
                        <div className="pb-3">
                            <h1 className="text-xl font-semibold pb-2">Theme</h1>
                            <div className="flex flex-row w-full justify-evenly">

                                {/* Black Theme */}
                                <div className={`flex flex-col justify-center hover:cursor-pointer px-6 py-1 rounded-xl ${theme === 'Black' ? 'border border-blue-400' : ''}`} onClick={() => setTheme("Black")}>
                                    <div className="mx-auto aspect-[80/79] w-[42px] lg:min-w-[80px] rounded-full" style={{ background: 'black' }}></div>
                                    <div className="text-center font-semibold pt-3">Black</div>
                                </div>

                                {/* Blue Theme */}
                                <div className={`flex flex-col justify-center hover:cursor-pointer px-6 py-1 rounded-xl ${theme === 'Blue' ? 'border border-blue-400' : ''}`} onClick={() => setTheme("Blue")}>
                                    <div className="mx-auto aspect-[80/79] w-[42px] lg:min-w-[80px] rounded-full bg-blue-600"></div>
                                    <div className="text-center font-semibold pt-3">Blue</div>
                                </div>

                                {/* Brown Theme */}
                                <div className={`flex flex-col justify-center hover:cursor-pointer px-6 py-1 rounded-xl ${theme === 'Brown' ? 'border border-blue-400' : ''}`} onClick={() => setTheme("Brown")}>
                                    <div className="mx-auto aspect-[80/79] w-[42px] lg:min-w-[80px] rounded-full bg-[#964B00]"></div>
                                    <div className="text-center font-semibold pt-3">Brown</div>
                                </div>

                                {/* Purple Theme */}
                                <div className={`flex flex-col justify-center hover:cursor-pointer px-6 py-1 rounded-xl ${theme === 'Purple' ? 'border border-blue-400' : ''}`} onClick={() => setTheme("Purple")}>
                                    <div className="mx-auto aspect-[80/79] w-[42px] lg:min-w-[80px] rounded-full bg-purple-500"></div>
                                    <div className="text-center font-semibold pt-3">Purple</div>
                                </div>
                            </div>
                        </div>

                        {/* Playlist Settings */}
                        {/* TODO: UNCOMMENT THIS AFTER SPOTIFY REVIEW */}
                        {/* <div >
                            <h1 className="text-xl font-semibold pb-1">Playlist Settings</h1>
                            <div className="flex items-center pt-3">
                                <input id="default-checkbox" type="checkbox" value="" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                <label htmlFor="default-checkbox" className="ml-3 md:text-xl font-medium text-gray-900 dark:text-gray-300">Include Recommended Artists in Playlist</label>
                            </div>
                        </div> */}
                    </div>
                </div>

                {/* Button Group - Download and Share Options  */}
                <div className={`grid-col-1 w-[350px] lg:min-w-[550px] pt-2 pb-4 ${(userSession?.user?.provider! === StreamingService.Spotify || userSession?.user?.provider! === StreamingService.LastFm) ? 'row-start-5' : 'row-start-4'}`}>
                    <div className="flex items-center justify-center gap-5">
                        {/* Download Button */}
                        <button type="button" className="inline-block px-11 py-2 border-2 bg-red-600 border-red-600 text-white font-medium text-lg lg:text-xl leading-tight uppercase rounded hover:bg-red-400 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
                            onClick={SavePlaylist}>Save</button>

                        {/* Share Button */}
                        {userSession?.user?.provider! !== StreamingService.Spotify ?
                            <button type="button" className="inline-block px-10 py-2 border-2 bg-blue-600 border-blue-600 text-white font-medium text-lg lg:text-xl leading-tight uppercase rounded focus:outline-none focus:ring-0 transition duration-150 ease-in-out"
                                onClick={ShareImage}>Share</button> : null
                        }
                    </div>
                </div>

                <Transition appear show={isOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={closeModal}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900"
                                        >
                                            <form onSubmit={HandleSearch}>
                                                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                        <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                    </div>
                                                    <input type="search" id="default-search" className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search For An Artist"
                                                        value={query}
                                                        onChange={e => setQuery(e.target.value)}
                                                        required />
                                                    <button type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Search</button>
                                                </div>
                                            </form>
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <ul className={`max-w-md divide-y divide-gray-200 ${searchResults.length ? 'border h-64' : ''} rounded-md overflow-y-scroll lg:overflow-auto`}>
                                                {searchResults.map((artist, index) =>
                                                    <li key={index} className="pl-4 py-3 sm:py-4 hover:cursor-pointer" onClick={() => HandleSelect(index)}>
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex-shrink-0">
                                                                <Image width={50} height={50} className="rounded-full" src={artist.image_url} alt={artist.name} />
                                                            </div>
                                                            <h1>{artist.name}</h1>
                                                        </div>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>

                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                                onClick={closeModal}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </div>
    )
}

export default Lineup;

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSessionFromCookie(context);
    let lineups: LineupArtist[][] = [];
    let name: string | null | undefined = null;

    // If there is no session, redirect the user back to the homepage
    if (!session) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    // Obtains Spotify lineup
    if (session.user.provider === StreamingService.Spotify) {
        lineups = await FetchSpotifyLineup(session.accessToken);
    }

    else if (session.user.provider === StreamingService.AppleMusic) {
        lineups = await FetchAppleMusicLineup(session.accessToken);
    }

    // Obtains LastFm lineup
    else if (session.user.provider === StreamingService.LastFm) {
        lineups = await FetchLastFmLineup(session.user.name!);
    }

    // Sets the user's name for the lineup
    name = session.user.name;

    // If the name's length is greater than the max allowed characters or starting from scratch, set to empty
    if (name && (name.length > 11 || name === "scratch")) {
        name = "";
    }

    // Returns name of lineup and lineup array
    return {
        props: {
            name: name,
            lineups: lineups,
        },
    };
}

// Layout
Lineup.getLayout = (page: ReactElement): ReactNode => (
    <DefaultLayout page="lineup">
        {page}
    </DefaultLayout>
);
