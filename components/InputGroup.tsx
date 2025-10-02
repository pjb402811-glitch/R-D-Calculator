import React from 'react';

interface InputGroupProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, htmlFor, children }) => {
  return (
    <div className="input-group">
      <label htmlFor={htmlFor}>
        <span className="red-dot"></span>
        {label}
      </label>
      {children}
    </div>
  );
};

export default InputGroup;