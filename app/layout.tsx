import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import PWALoader from "./pwa-loader"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f0f9ff" />
      </head>
      <body>
        {children}
        <PWALoader />
      </body>
    </html>
  )
}
