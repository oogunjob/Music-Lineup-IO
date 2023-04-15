import { Accordion } from 'flowbite-react';
import React, { ReactElement, ReactNode } from 'react'
import DefaultLayout from '../components/layouts/DefaultLayout';
import SEO from '../components/SEO';

function About() {
    return (
        <div className='min-h-full py-[20px]'>
            <SEO title="About" description="Learn more about how to use MusicLineup.io to create customized musical graphics along with Ogunjobi Technology's initiative and future developments." />

            <section id="faqs" className='pb-[48px]'>
                <h1 className='flex justify-center font-semibold text-2xl md:text-4xl pb-7'>Frequently Asked Questions</h1>
                <Accordion alwaysOpen={true} className='max-w-sm md:max-w-2xl mx-auto'>
                    <Accordion.Panel>
                        <Accordion.Title className='text-black'>
                            What is MusicLineup.io?
                        </Accordion.Title>
                        <Accordion.Content>
                            <p className="mb-2">
                                <b>MusicLineup.io</b> is a free graphic creator that presents your favorite musical artists and songs in NBA All-Star Themed
                                cards that you can share with friends. The musical artists or songs can come directly from your respective streaming service and
                                are based on your listening habits. You can show off your cards by selecting the download button or share with friends to see
                                who has the better lineup. You can also customize your graphic card to your preference from which artists or songs are
                                included to even the theme and name!
                            </p>
                        </Accordion.Content>
                    </Accordion.Panel>
                    <Accordion.Panel>
                        <Accordion.Title className='text-black'>
                            Does MusicLineup.io Keep My Data?
                        </Accordion.Title>
                        <Accordion.Content>
                            <p className="mt-2 text-secondary-500">Short Answer: <b>No.</b></p>
                            <p className="mt-2 text-secondary-500">Long Answer: <b>MusicLineup.io</b>, does not keep or store data from any platform that is linked to the application or session.
                                <b>MusicLineup.io</b> only performs read only actions on linked accounts to display personalized graphics for the user. The only recorded statistics are performed via
                                Google Analytics to keep count of page views and graphics created to improve <b>MuiscLineup.io</b>. All users are anonoymous and safe to link a music streaming platform
                                to generate graphics.
                            </p>
                            <p className="mt-2 text-secondary-500">For Spotify users, if you would like to unlink your account to MusicLineup.io, you can do so <a href='https://support.spotify.com/us/article/spotify-on-other-apps/' className='text-blue-600 hover:underline' target='_blank' rel="noopener noreferrer">here</a> by selecting <b>Login to your Apps page</b> and selecting
                                remove access to any unwanted apps. </p>
                        </Accordion.Content>
                    </Accordion.Panel>
                    <Accordion.Panel>
                        <Accordion.Title>
                            {`What's Next For MusicLineup.io`}
                        </Accordion.Title>
                        <Accordion.Content>
                            <p className="mb-2 text-secondary-500">
                                You tell us! See the contact section in the footer to reach out for ideas or improvements!
                            </p>
                            <p className="mb-2 text-secondary-500">
                                There are more features coming so stay tuned.
                            </p>
                            <p className="mb-2 text-secondary-500">
                                Although <b>MusicLineup.io</b> is free, my only wish from is that I can either attend the NBA All-Star Game or meet Coi Leray :)
                            </p>

                        </Accordion.Content>
                    </Accordion.Panel>
                </Accordion>
            </section>

            <section id="privacy" className='pb-[48px]'>
                <h1 className='flex justify-center font-semibold text-2xl md:text-4xl pb-7'>Privacy Policy</h1>
                <div className='max-w-sm md:max-w-2xl mx-5 md:mx-auto'>
                    <p className='pb-5'>MusicLineup.io was built and maintained entirely by Tosin Ogunjobi. This service is free of use for all users who intend to create personalized graphics
                        based on music selection. For all visitors, MusicLineup.io does not collect, use, or disclose any personal information to any third-party from those who use the service. MusicLineup.io
                        only uses Google Analytics to analyze web traffic and improve upon current features. If you choose to use MusicLineup.io, then you agree to the terms of this policy.
                    </p>

                    <p className='pb-5'>{`MusicLineup.io integrates the use of the Spotify Web API, Apple Music Music Kit, and the public APIs of LastFm and Deezer. For all integrated services, the scope of the permissions granted have been limited to only
                        read the user's top streamed artists and songs to create a more accurate personalized graphic. Data is securely presented to only the user,
                        and MusicLineup.io has no access to modifying or removing any data from your music library. For those who wish to opt out to using an integrated API, you are welcome to using the app via the
                        Start From Scratch login option.`}
                    </p>

                    <p>For any additional comments, questions, concerns, or feedback, please feel free to share via any of the provided contact links in the <b> CONTACT</b> section of the footer.</p>
                </div>
            </section>
        </div>
    )
}

export default About;

About.getLayout = (page: ReactElement): ReactNode => (
    <DefaultLayout page="about">
        {page}
    </DefaultLayout>
);