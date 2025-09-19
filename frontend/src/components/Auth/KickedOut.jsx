import React from 'react'

const KickedOut = () => {
  return (
    <div className="kicked-out-page">
      {/* Brand pill */}
      <div className="brand-pill">✦ Intervue Poll</div>
      
      {/* Main content */}
      <div className="content-container">
        <h1 className="main-heading">
          You have been <span className="highlight">Kicked Out</span>!
        </h1>
        
        <p className="description">
          Looks like Teacher had removed you from the poll system. Please try again after some time.
        </p>
      </div>

      {/* Styles matching homepage */}
      <style>{`
        .kicked-out-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: white;
          text-align: center;
        }

        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .content-container {
          max-width: 600px;
          width: 100%;
        }

        .main-heading {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0 0 20px 0;
          line-height: 1.1;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .main-heading .highlight {
          background: linear-gradient(45deg, #ff6b6b, #ffa500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
        }

        .description {
          font-size: 1.25rem;
          font-weight: 400;
          line-height: 1.6;
          margin: 0;
          opacity: 0.9;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .main-heading {
            font-size: 2.5rem;
          }
          
          .description {
            font-size: 1.1rem;
          }
          
          .brand-pill {
            font-size: 14px;
            padding: 10px 16px;
          }
        }

        @media (max-width: 480px) {
          .main-heading {
            font-size: 2rem;
          }
          
          .description {
            font-size: 1rem;
          }
          
          .kicked-out-page {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  )
}

export default KickedOut
