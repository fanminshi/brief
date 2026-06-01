import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IntentChat — AI Communication Compiler",
  description: "Cursor for workplace communication",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "#020617", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  )
}
