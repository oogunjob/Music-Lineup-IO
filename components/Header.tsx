import { Button } from 'flowbite-react';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface HeaderProps {
    page: string;
}

function Header({ page }: HeaderProps) {
    const { data: session } = useSession();

    return (
        <>
            <nav className="border-gray-200 bg-white px-2 py-2.5 dark:border-gray-700 dark:bg-gray-800 sm:px-4 mx-5 pt-[15px]">
                <div className="mx-auto flex flex-wrap items-center justify-between container">
                    <Link href="/" className="flex items-center">
                        <img src="/assets/apple-touch-icon.png" className="mr-3 h-6 sm:h-9" alt="Music Lineup IO Logo" />
                        <span className="self-center whitespace-nowrap text-xl lg:text-2xl font-bold dark:text-white">MusicLineup.io</span>
                    </Link>

                    {/* Displays option to re-navigate to lineup if the user is already signed in */}
                    {session && page === 'about' ? <Link href='/lineup'><StarIcon width={45} fill={'#FFD700'} /></Link> : ''}

                    <div className="flex md:order-2">
                        {/* Sign Out Button if User is Logged In */}
                        {session &&
                            <Button onClick={async () => await signOut({ callbackUrl: '/' })}>
                                <span className='text-xl'>Sign Out</span>
                            </Button>
                        }
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Header;

