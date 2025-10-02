import React, { useState, useEffect } from 'react';
import type { Condition, ConditionStatus } from '../types';
import Icon from './Icon';

interface ChecklistItemProps {
  condition: Condition;
  onUpdate: (id: number, description: string, details: string, status: ConditionStatus) => void;
  onRemove: (id: number) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ condition, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localDescription, setLocalDescription] = useState(condition.description);
  const [localDetails, setLocalDetails] = useState(condition.details);

  useEffect(() => {
    setLocalDescription(condition.description);
    setLocalDetails(condition.details);
  }, [condition.description, condition.details]);


  const handleStatusChange = (newStatus: ConditionStatus) => {
    onUpdate(condition.id, localDescription, localDetails, newStatus);
  };

  const handleBlur = () => {
    if (localDescription !== condition.description || localDetails !== condition.details) {
      onUpdate(condition.id, localDescription, localDetails, condition.status);
    }
  };

  return (
    <div className={`checklist-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="checklist-item-header" onClick={() => setIsExpanded(!isExpanded)}>
        <p className="checklist-item-description">{condition.description || '새 조건'}</p>
        <div className="condition-actions">
          <button
            className={`ox-button ${condition.status === 'O' ? 'active-o' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleStatusChange('O'); }}
            aria-label="Condition met"
          >
            O
          </button>
          <button
            className={`ox-button ${condition.status === 'X' ? 'active-x' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleStatusChange('X'); }}
            aria-label="Condition not met"
          >
            X
          </button>
        </div>
        <Icon name="chevron-down" className="chevron-icon" />
      </div>
      <div className="checklist-item-body">
        <div className="space-y-4">
          <div>
            <label htmlFor={`desc-${condition.id}`} className="block mb-2 font-semibold text-sm text-slate-300">조건명</label>
            <input
              id={`desc-${condition.id}`}
              type="text"
              className="condition-description-input"
              value={localDescription}
              placeholder="조건 설명을 입력하세요"
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={handleBlur}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div>
            <label htmlFor={`details-${condition.id}`} className="block mb-2 font-semibold text-sm text-slate-300">세부 내용</label>
            <textarea
              id={`details-${condition.id}`}
              className="details-textarea"
              value={localDetails}
              placeholder="세부 내용을 입력하세요 (선택 사항)"
              onChange={(e) => setLocalDetails(e.target.value)}
              onBlur={handleBlur}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <button
            className="remove-condition-button"
            onClick={(e) => { e.stopPropagation(); onRemove(condition.id); }}
            aria-label="Remove condition"
          >
            <Icon name="trash-alt" className="mr-2" /> 조건 삭제
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistItem;