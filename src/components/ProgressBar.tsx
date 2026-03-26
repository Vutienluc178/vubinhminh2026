import React from 'react';

const ProgressBar = ({ currentStep }) => {
  const steps = [
    'INPUT',
    'ANALYSIS',
    'CONFIG',
    'GENERATION',
    'RESULT',
    'WORKSHEET_INPUT',
    'WORKSHEET_RESULT',
    'BANK'
  ];

  const currentIndex = steps.indexOf(currentStep);

  return (
    <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px' }}>
      <div
        style={{
          width: `${((currentIndex + 1) / steps.length) * 100}%`,
          backgroundColor: '#76c7c0',
          height: '20px',
          borderRadius: '5px'
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {steps.map((step, index) => (
          <span key={index} style={{ flex: 1, textAlign: 'center' }}>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
