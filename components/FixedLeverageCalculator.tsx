import React, { useState, useCallback, useEffect } from 'react';
import type { Position, CalculationResult } from '../types';
import Icon from './Icon';
import InputGroup from './InputGroup';
import ResultItem from './ResultItem';

const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, '')) || 0;
};

const formatNumberString = (value: string): string => {
    const num = value.replace(/,/g, '');
    if (num.trim() === '' || isNaN(parseFloat(num))) return value;
    
    const parts = num.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (parts.length > 1) {
        const fractionalPart = parts[1].substring(0, 2);
        return `${integerPart}.${fractionalPart}`;
    }
    
    return integerPart;
};

const FixedLeverageCalculator: React.FC = () => {
    const [totalCapital, setTotalCapital] = useState(localStorage.getItem('totalCapital') || '10,000,000');
    const [entryCapital, setEntryCapital] = useState(localStorage.getItem('entryCapital') || '1,000,000');
    const [riskPercent, setRiskPercent] = useState('1');
    const [entryPrice, setEntryPrice] = useState('');
    const [leverage, setLeverage] = useState('50');
    const [riskRewardRatio, setRiskRewardRatio] = useState('1.5');
    const [position, setPosition] = useState<Position>('long');
    const [feeRate, setFeeRate] = useState('0.04');
    
    const [results, setResults] = useState<CalculationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('totalCapital', totalCapital);
    }, [totalCapital]);

    useEffect(() => {
        localStorage.setItem('entryCapital', entryCapital);
    }, [entryCapital]);

    const handleCalculate = useCallback(() => {
        setError(null);
        setWarning(null);
        setResults(null);

        const capital = parseFormattedNumber(totalCapital);
        const usedCapital = parseFormattedNumber(entryCapital);
        const risk = parseFloat(riskPercent);
        const entry = parseFormattedNumber(entryPrice);
        const leverageValue = parseFloat(leverage);
        const rr = parseFloat(riskRewardRatio);
        const fee = parseFloat(feeRate);

        if ([capital, usedCapital, risk, entry, leverageValue].some(v => v <= 0)) {
            setError('총 자산, 1회 진입 자산, 허용 손실 비율, 진입가, 레버리지는 0보다 커야 합니다.');
            return;
        }
        if (isNaN(rr) || rr <= 0) {
            setError('손익비는 0보다 커야 합니다.');
            return;
        }
        if (isNaN(fee)) {
            setError('수수료율을 입력하세요.');
            return;
        }

        const maxLoss = capital * (risk / 100);
        const positionValue = usedCapital * leverageValue;
        const quantity = positionValue / entry;
        
        if (quantity <= 0) {
             setError('진입 수량을 계산할 수 없습니다. 입력값을 확인해주세요.');
             return;
        }

        const lossPerUnit = maxLoss / quantity;
        const stopLossPrice = position === 'long' ? entry - lossPerUnit : entry + lossPerUnit;

        const totalLoss = maxLoss;
        const lossRate = risk;

        const maintenance = 0.005;
        let liquidationPrice = 0;
        if (leverageValue > 0) {
            liquidationPrice = position === 'long'
                ? entry * leverageValue / (leverageValue + 1 - (maintenance * leverageValue))
                : entry * leverageValue / (leverageValue - 1 + (maintenance * leverageValue));
        }

        const grossProfitPerUnitForUserRR = lossPerUnit * rr;
        const riskRewardTargetPrice = position === 'long'
            ? entry + grossProfitPerUnitForUserRR
            : entry - grossProfitPerUnitForUserRR;

        const profit = (Math.abs(riskRewardTargetPrice - entry)) * quantity;
        const totalFee = (entry * quantity + riskRewardTargetPrice * quantity) * (fee / 100);
        const profitTotal = profit - totalFee;
        const profitRate = (profitTotal / capital) * 100;

        setResults({
            leverage: leverageValue,
            quantity,
            maxQuantity: quantity, 
            riskRewardTargetPrice,
            totalLoss,
            lossRate,
            liquidationPrice,
            profitTotal,
            profitRate,
            totalFee,
            stopLossPrice
        });
        
        let newWarning = '';
        const warnLiqStop = (position === 'long' && liquidationPrice > stopLossPrice) || (position === 'short' && liquidationPrice < stopLossPrice);
        if (warnLiqStop) {
            newWarning += '계산된 손절가 도달 전 청산될 수 있습니다. 레버리지나 허용 손실 비율을 조정하세요.';
        }
        setWarning(newWarning || null);

    }, [totalCapital, entryCapital, riskPercent, entryPrice, leverage, riskRewardRatio, position, feeRate]);
    
    const handleReset = () => {
        setTotalCapital('10,000,000');
        setEntryCapital('1,000,000');
        setRiskPercent('1');
        setEntryPrice('');
        setLeverage('50');
        setRiskRewardRatio('1.5');
        setPosition('long');
        setFeeRate('0.04');
        setResults(null);
        setError(null);
        setWarning(null);
    };

    return (
        <>
            <div>
                <h2><Icon name="calculator" /> 고정 레버리지 손절가 계산</h2>
                <div className="input-grid">
                    <InputGroup label="총 자산" htmlFor="totalCapital">
                        <input id="totalCapital" type="text" value={totalCapital} onChange={(e) => setTotalCapital(formatNumberString(e.target.value))} inputMode="numeric" />
                    </InputGroup>
                    <InputGroup label="1회 진입 자산" htmlFor="entryCapital">
                        <input id="entryCapital" type="text" value={entryCapital} onChange={(e) => setEntryCapital(formatNumberString(e.target.value))} inputMode="numeric" />
                    </InputGroup>
                    <InputGroup label="포지션" htmlFor="position">
                        <div className="position-button-group">
                            <button type="button" id="positionLong" className={`position-button ${position === 'long' ? 'active' : ''}`} onClick={() => setPosition('long')}>Long (롱)</button>
                            <button type="button" id="positionShort" className={`position-button ${position === 'short' ? 'active' : ''}`} onClick={() => setPosition('short')}>Short (숏)</button>
                        </div>
                    </InputGroup>
                    <InputGroup label="진입가" htmlFor="entryPrice">
                        <input id="entryPrice" type="text" value={entryPrice} onChange={(e) => setEntryPrice(formatNumberString(e.target.value))} inputMode="decimal" />
                    </InputGroup>
                    <InputGroup label="레버리지 (배)" htmlFor="leverage">
                        <input id="leverage" type="number" value={leverage} onChange={(e) => setLeverage(e.target.value)} step="1" />
                    </InputGroup>
                    <InputGroup label="허용 손실 비율 (%)" htmlFor="riskPercent">
                        <input id="riskPercent" type="number" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} step="0.1" />
                    </InputGroup>
                    <InputGroup label="손익비 (RR)" htmlFor="riskRewardRatio">
                        <input id="riskRewardRatio" type="number" value={riskRewardRatio} onChange={(e) => setRiskRewardRatio(e.target.value)} step="0.1" inputMode="decimal" />
                    </InputGroup>
                    <InputGroup label="수수료율 (%)" htmlFor="feeRate">
                        <input id="feeRate" type="number" value={feeRate} onChange={(e) => setFeeRate(e.target.value)} step="0.001" />
                    </InputGroup>
                </div>
                <div className="action-buttons-container">
                    <div className="action-buttons">
                        <button onClick={handleCalculate} className="calculate-button"><Icon name="play" className="mr-2" /> 계산하기</button>
                        <button onClick={handleReset} className="reset-button"><Icon name="undo" className="mr-2" /> 초기화</button>
                    </div>
                </div>
            </div>

            {(results || error) && (
                 <div className="result-section mt-8">
                    <h2><Icon name="chart-line" /> 계산 결과</h2>
                    {error && (
                        <div className="error">
                            <Icon name="exclamation-triangle" className="mr-2" /> {error}
                        </div>
                    )}
                    {results && !error && results.stopLossPrice !== undefined && (
                         <>
                            <div className="results-grid">
                                <ResultItem label="필요 손절가" value={results.stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} />
                                <ResultItem label="진입 수량" value={results.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} />
                                <ResultItem label="최대 진입 가능 수량" value={results.maxQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} />
                                <ResultItem label="손익비 목표가 (설정 RR)" value={results.riskRewardTargetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} />
                                <ResultItem label="손절가 도달시 손실액" value={`${Math.floor(results.totalLoss).toLocaleString()} (${results.lossRate.toFixed(2)}%)`} />
                                <ResultItem label="강제 청산예정가" value={results.liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} />
                                <ResultItem label="총 예상수익(수익률)" value={`${Math.floor(results.profitTotal).toLocaleString()} (${results.profitRate.toFixed(2)}%)`} />
                                <ResultItem label="총 수수료" value={Math.floor(results.totalFee).toLocaleString()} />
                            </div>
                            {warning && (
                                <div className="warning whitespace-pre-line">
                                    <Icon name="triangle-exclamation" className="mr-2 self-start" />
                                    {warning}
                                </div>
                            )}
                        </>
                    )}
                 </div>
            )}
        </>
    );
};

export default FixedLeverageCalculator;