import React from 'react';

interface ResultItemProps {
  label: string;
  value: React.ReactNode;
}

const ResultItem: React.FC<ResultItemProps> = ({ label, value }) => {
  return (
    <div className="result-item">
      <div className="result-label">{label}</div>
      <div className="result-value">{value || '-'}</div>
    </div>
  );
};

export default ResultItem;