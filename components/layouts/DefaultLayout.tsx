import React, { ReactNode } from 'react';
import Footer from '../Footer';
import Header from '../Header';

export interface DefaultLayoutProps {
    children?: ReactNode;
    page: string;
}

function DefaultLayout({ children, page }: DefaultLayoutProps) {
    return (
        <div className="h-full">
            <div className="h-full flex flex-col">
                <Header page={page} />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    )
}

export default DefaultLayout