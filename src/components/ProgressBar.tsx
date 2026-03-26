import React from 'react';

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div style={{ width: '100%', backgroundColor: '#e0e0e0' }}>
            <div
                style={{
                    width: `${progress}%`,
                    backgroundColor: '#3b5998',
                    height: '20px'
                }}
            />
        </div>
    );
};
