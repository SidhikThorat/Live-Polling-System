import React, { useState } from 'react'
import CreatePollForm from './CreatePollForm'

const TeacherDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0)
  const onCreated = () => setRefreshKey((k) => k + 1)
  return (
    <div className="teacher-root">
      {/* top header */}
      <div className="header-row">
        <div className="brand-pill">✦ Intervue Poll</div>

        <div className="heading-area">
          <h1 className="main-title">Let’s <span className="bold">Get Started</span></h1>
          <p className="lead">
            you’ll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
          </p>
        </div>
      </div>

      {/* main content area */}
      <div className="main-grid single">
        {/* Left large panel for CreatePollForm */}
        <section className="left-panel">
          <CreatePollForm onCreated={onCreated} />
        </section>
      </div>

      {/* floating CTA bottom-right (matches screenshot style) */}
      <button
        className="ask-btn"
        type="button"
        onClick={() => {
          // If CreatePollForm exposes a way to open a modal, you can connect it.
          // Keeping behaviour-free here because original functionality is in child.
          // Optionally scroll to the CreatePollForm area:
          const el = document.querySelector('.left-panel')
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
      >
        Ask Question
      </button>

      {/* Styles scoped to component */}
      <style>{`
        :root{
          --bg: #ffffff;
          --muted: #9aa0a6;
          --panel: #f3f4f6;
          --card-bg: #ffffff;
          --purple: #7c5cff;
          --blue: #5ba0ff;
          --gradient: linear-gradient(90deg, var(--purple) 0%, var(--blue) 100%);
          --border: #e8e9ef;
          --text: #111827;
        }

        .teacher-root{
          min-height:100vh;
          padding: 36px 48px;
          box-sizing: border-box;
          background: var(--bg);
          color: var(--text);
          position: relative;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }

        .header-row{
          max-width:1200px;
          margin: 0 auto 28px;
          display:flex;
          flex-direction:column;
          gap:18px;
        }

        .brand-pill{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:6px 12px;
          border-radius:999px;
          background: var(--gradient);
          color: #fff;
          font-size:13px;
          width: fit-content;
          font-weight:600;
        }

        .heading-area{
          max-width:1200px;
        }
        .main-title{
          margin:0;
          font-size:34px;
          font-weight:600;
          color: var(--text);
          line-height:1.05;
        }
        .main-title .bold{ font-weight:800; }

        .lead{
          margin-top:10px;
          color: var(--muted);
          font-size:14px;
          max-width:880px;
        }

        /* Layout: left big form, right side stacked cards */
        .main-grid{
          max-width: 1200px;
          margin: 18px auto 120px;
          display:grid;
          grid-template-columns: 1fr 360px;
          gap: 28px;
          align-items: start;
        }
        .main-grid.single{ grid-template-columns: 1fr; }

        /* left panel styles — mimic large question editor area */
        .left-panel{
          background: transparent;
          min-height: 360px;
          border-radius: 8px;
        }
        /* we expect CreatePollForm to render its own inputs; add wrapper card style to make it look like screenshot */
        .left-panel > * {
          background: var(--card-bg);
          padding: 22px;
          border-radius: 12px;
          border: 1px solid var(--border);
          box-shadow: 0 6px 24px rgba(16,24,40,0.04);
          min-height: 320px;
        }

        /* right column — stacked boxes */
        .card{
          background: var(--card-bg);
          border-radius: 10px;
          padding: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 6px 20px rgba(16,24,40,0.03);
        }
        .card-title{ margin:0 0 12px 0; font-size:14px; color:var(--text); font-weight:700; }

        /* floating CTA */
        .ask-btn{
          position: fixed;
          right: 28px;
          bottom: 26px;
          height:44px;
          min-width:160px;
          padding: 0 22px;
          border-radius:999px;
          border:none;
          color:#fff;
          font-weight:700;
          background: var(--gradient);
          box-shadow: 0 10px 30px rgba(92,72,214,0.12);
          cursor:pointer;
          z-index: 60;
        }
        .ask-btn:active{ transform: translateY(1px); }

        /* responsive: collapse to single column on small screens */
        @media (max-width: 980px){
          .main-grid{
            grid-template-columns: 1fr;
          }
          .left-panel{
            order: 1;
          }
          .ask-btn{
            right: 16px;
            bottom: 16px;
          }
        }

        /* small tweaks for inputs inside CreatePollForm that follow the design:
           we don't change child's markup, but provide some common classes they might use.
           (No functional change — this is simply helpful defaults.)
        */
        .left-panel .editor-area {
          background: var(--panel);
          border-radius:8px;
          padding:18px;
          min-height: 120px;
          border: 1px solid var(--border);
        }

      `}</style>
    </div>
  )
}

export default TeacherDashboard
