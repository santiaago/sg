import { useState } from 'react'
import type { JSX } from 'react'

export function CopyUrlButton(): JSX.Element {
  const [copied, setCopied] = useState<boolean>(false)
  
  const copyUrlToClipboard = (): void => {
    try {
      // Get current URL including hash
      const currentUrl = window.location.href
      navigator.clipboard.writeText(currentUrl)
        .then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
        .catch((err) => {
          console.error('Failed to copy URL: ', err)
        })
    } catch (err) {
      console.error('Clipboard API not available: ', err)
    }
  }
  
  return (
    <button
      onClick={copyUrlToClipboard}
      className="ml-2 px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors relative"
      title="Copy URL to clipboard"
    >
      {copied ? (
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
          </svg>
          Copy URL
        </span>
      )}
    </button>
  )
}