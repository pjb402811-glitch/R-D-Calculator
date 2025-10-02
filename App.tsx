import React, { useState, useEffect, useMemo } from 'react';
import type { Condition, ConditionStatus } from './types';
import { INITIAL_CONDITIONS_DESC } from './constants';
import ChecklistItem from './components/ChecklistItem';
import CalculatorSection from './components/CalculatorSection';
import FixedLeverageCalculator from './components/FixedLeverageCalculator';
import SplitPurchaseSimulator from './components/SplitPurchaseSimulator';
import Icon from './components/Icon';

type CalculatorTab = 'variable' | 'fixed';
type MainTool = 'leverage' | 'split';

const LeverageCalculator: React.FC = () => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [activeTab, setActiveTab] = useState<CalculatorTab>('variable');

  useEffect(() => {
    try {
      const savedConditions = localStorage.getItem('conditions');
      if (savedConditions) {
        const parsedConditions = JSON.parse(savedConditions) as (Omit<Condition, 'details'> & Partial<Pick<Condition, 'details'>>)[];
        const migratedConditions = parsedConditions.map(c => ({
          ...c,
          id: c.id,
          description: c.description,
          status: c.status,
          details: c.details || '',
        }));
        setConditions(migratedConditions);
      } else {
        setConditions(
          INITIAL_CONDITIONS_DESC.map((desc, index) => ({
            id: index + 1,
            description: desc,
            details: '',
            status: 'X',
          }))
        );
      }
    } catch (error) {
      console.error("Failed to parse conditions from localStorage", error);
      setConditions(
        INITIAL_CONDITIONS_DESC.map((desc, index) => ({
          id: index + 1,
          description: desc,
          details: '',
          status: 'X',
        }))
      );
    }
  }, []);

  useEffect(() => {
    if (conditions.length > 0) {
      localStorage.setItem('conditions', JSON.stringify(conditions));
    }
  }, [conditions]);


  const handleAddCondition = () => {
    const newId = conditions.length > 0 ? Math.max(...conditions.map(c => c.id)) + 1 : 1;
    const newCondition: Condition = {
      id: newId,
      description: '',
      details: '',
      status: 'X',
    };
    setConditions(prev => [...prev, newCondition]);
  };

  const handleRemoveCondition = (id: number) => {
    const newConditions = conditions.filter(c => c.id !== id);
    setConditions(newConditions);
    if (newConditions.length === 0) {
      localStorage.removeItem('conditions');
    }
  };

  const handleUpdateCondition = (id: number, description: string, details: string, status: ConditionStatus) => {
    setConditions(prev =>
      prev.map(c => (c.id === id ? { ...c, description, details, status } : c))
    );
  };

  const allConditionsMet = useMemo(() => {
    if (conditions.length === 0) return false;
    return conditions.every(c => c.status === 'O');
  }, [conditions]);

  const metConditionsCount = useMemo(() => {
    return conditions.filter(c => c.status === 'O').length;
  }, [conditions]);

  return (
    <>
      <div className="section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="!m-0 !p-0 !border-none"><Icon name="list-check" /> 진입조건 확인</h2>
          <span className="conditions-summary">
            {metConditionsCount} / {conditions.length} 충족
          </span>
        </div>
        <div className="space-y-3">
          {conditions.length > 0 ? (
            conditions.map(condition => (
              <ChecklistItem
                key={condition.id}
                condition={condition}
                onUpdate={handleUpdateCondition}
                onRemove={handleRemoveCondition}
              />
            ))
          ) : (
            <p className="text-center text-gray-400 my-4">아직 추가된 조건이 없습니다.</p>
          )}
        </div>
        <button onClick={handleAddCondition} className="add-condition-button">
          <Icon name="plus" className="mr-2" /> 조건 추가
        </button>
      </div>

      {allConditionsMet && (
        <div className="section">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'variable' ? 'active' : ''}`}
              onClick={() => setActiveTab('variable')}
            >
              변동 레버리지
            </button>
            <button
              className={`tab-button ml-auto ${activeTab === 'fixed' ? 'active' : ''}`}
              onClick={() => setActiveTab('fixed')}
            >
              고정 레버리지
            </button>
          </div>
          {activeTab === 'variable' && <CalculatorSection />}
          {activeTab === 'fixed' && <FixedLeverageCalculator />}
        </div>
      )}
    </>
  );
}


const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<MainTool>('leverage');
  
  return (
    <div className="container">
      <h1>레버리지 & 분할매수 계산기</h1>
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTool === 'leverage' ? 'active' : ''}`}
          onClick={() => setActiveTool('leverage')}
        >
          <Icon name="balance-scale" className="mr-2" /> 레버리지 계산
        </button>
        <button
          className={`tab-button ml-auto ${activeTool === 'split' ? 'active' : ''}`}
          onClick={() => setActiveTool('split')}
        >
          <Icon name="chart-pie" className="mr-2" /> 분할매수 계산
        </button>
      </div>

      {activeTool === 'leverage' && <LeverageCalculator />}
      {activeTool === 'split' && <SplitPurchaseSimulator />}
    </div>
  );
};

export default App;