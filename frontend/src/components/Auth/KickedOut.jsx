import React from 'react'

const KickedOut = () => {
  return (
    <div className="kicked-out-page">
      {/* Brand pill */}
      <div className="brand-pill">✦ Intervue Poll</div>
      
      {/* Main content */}
      <div className="content-container">
        <h1 className="main-heading">
          You've been Kicked out!
        </h1>
        
        <p className="description">
          Looks like the teacher had removed you from the poll system .Please Try again sometime.
        </p>
      </div>

      {/* Styles matching homepage */}
      <style>{`
        .kicked-out-page {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #111827;
          text-align: center;
        }

        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
          color: white;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 40px;
          box-shadow: 0 6px 20px rgba(15,23,42,0.04);
        }

        .content-container {
          max-width: 600px;
          width: 100%;
        }

        .main-heading {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 20px 0;
          line-height: 1.2;
          color: #111827;
        }

        .description {
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.6;
          margin: 0;
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .main-heading {
            font-size: 1.75rem;
          }
          
          .description {
            font-size: 0.9rem;
          }
          
          .brand-pill {
            font-size: 12px;
            padding: 6px 12px;
          }
        }

        @media (max-width: 480px) {
          .main-heading {
            font-size: 1.5rem;
          }
          
          .description {
            font-size: 0.85rem;
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
