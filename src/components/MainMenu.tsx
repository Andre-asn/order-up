import React from 'react'

import '../main-menu.css'

function IconPlus({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M16 11C18.209 11 20 9.209 20 7C20 4.791 18.209 3 16 3C13.791 3 12 4.791 12 7C12 9.209 13.791 11 16 11Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 13C10.209 13 12 11.209 12 9C12 6.791 10.209 5 8 5C5.791 5 4 6.791 4 9C4 11.209 5.791 13 8 13Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 21V20C2 17.791 3.791 16 6 16H10C12.209 16 14 17.791 14 20V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 16H18C20.209 16 22 17.791 22 20V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function MainMenu() {
  const handleCreateGame = () => {
    console.log('Creating new game...')
  }

  const handleJoinGame = () => {
    console.log('Joining game...')
  }

  return (
    <div className="menu-root">
      <div className="menu-stage">
        <div className="menu-title">
          <div className="menu-title-row">
            <h1 className="menu-title-text">ORDER UP!</h1>
          </div>
        </div>

        <div className="menu-playfield">
          <div className="menu-faces">
            <img src="/Untitled-1.gif" alt="Chef 1" className="face face-top" />
            <img src="/Untitled-2.gif" alt="Chef 2" className="face face-top-right" />
            <img src="/Untitled-3.gif" alt="Chef 3" className="face face-right" />
            <img src="/Untitled-4.gif" alt="Chef 4" className="face face-bottom-right" />
            <img src="/Untitled-5.gif" alt="Chef 5" className="face face-bottom" />
            <img src="/Untitled-6.gif" alt="Chef 6" className="face face-bottom-left" />
            <img src="/Untitled-7.gif" alt="Chef 7" className="face face-left" />
            <img src="/Untitled-8.gif" alt="Chef 8" className="face face-top-left" />
          </div>

          <div className="menu-pot">
            <img src="/soup.gif" alt="Boiling soup pot" className="pot-img" />

            <div className="menu-buttons">
              <button onClick={handleCreateGame} className="menu-btn btn-light">
                <span className="btn-content">
                  <IconPlus size={20} className="btn-icon" />
                  CREATE GAME
                </span>
                <span className="btn-corner corner-tr" />
                <span className="btn-corner corner-bl" />
              </button>

              <div className="menu-btn-stack">
                <button onClick={handleJoinGame} className="menu-btn btn-dark">
                  <span className="btn-content">
                    <IconUsers size={20} className="btn-icon" />
                    JOIN GAME
                  </span>
                  <span className="btn-corner corner-tr alt" />
                  <span className="btn-corner corner-bl alt" />
                </button>

                <button onClick={() => console.log('Tutorial...')} className="menu-btn btn-light">
                  <span className="btn-content">TUTORIAL</span>
                  <span className="btn-corner corner-tr" />
                  <span className="btn-corner corner-bl" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


