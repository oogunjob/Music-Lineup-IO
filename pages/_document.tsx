import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        <Script
          src="https://js-cdn.music.apple.com/musickit/v1/musickit.js"
          strategy="beforeInteractive"
        />
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8150443190326499"
          crossOrigin="anonymous"
          strategy="beforeInteractive" />
      </body>
    </Html>
  )
}
