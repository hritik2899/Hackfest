import React from 'react'

const ScoreCard = ({ value, label }) => {
     console.log(value);
     return (
          <div style={{ height: "200px", width: "200px" }}>
               <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle"
                         strokeDasharray={`${value * 10}, 100`}
                         d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={"0.4rem"}>{Number(value).toFixed(1)}</text>
               </svg>
               <div>{label}</div>
          </div >

     )
}

export default ScoreCard