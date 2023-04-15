import '../styles/globals.css'
import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import ErrorBoundary from '../components/ErrorBoundary'
import Script from 'next/script';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page)

  return (
    <ErrorBoundary>
      <Script id='initializer' strategy='lazyOnload' src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`} />
      <Script id='datalayer' strategy='lazyOnload' >
        {
          `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}');
          `
        }
      </Script>
      {/* <Script src="https://js-cdn.music.apple.com/musickit/v1/musickit.js"></Script> */}

      <SessionProvider session={pageProps.session}>
        {(getLayout(<Component {...pageProps} />))}
      </SessionProvider>
    </ErrorBoundary>
  )
}
